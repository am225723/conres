import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, AlertCircle, Mic, MicOff, Activity, Users, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const TONE_AGGRESSION_SCORE = {
  calm: 0, empathetic: 0, compassionate: 0, supportive: 0, affectionate: 0,
  curious: 5, playful: 5, hopeful: 5, nostalgic: 5,
  anxious: 20, worried: 20, vulnerable: 15, sad: 15, disappointed: 25,
  assertive: 30, firm: 30, frustrated: 45, defensive: 50,
  confrontational: 70, hostile: 85, aggressive: 90,
  Waiting: 0, neutral: 10,
};

const SEVERITY = {
  NONE: 'none',
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
};

const OVERTALK_THRESHOLD = 3;
const ERRATIC_TIME_WINDOW_MS = 45000;
const ERRATIC_MSG_THRESHOLD = 4;
const AGGRESSION_ROLLING_WINDOW = 5;
const AGGRESSION_ALERT_SCORE = 55;

function getSeverityFromScore(score) {
  if (score >= 70) return SEVERITY.CRITICAL;
  if (score >= 45) return SEVERITY.WARNING;
  if (score >= 20) return SEVERITY.INFO;
  return SEVERITY.NONE;
}

function getToneScore(tone) {
  return TONE_AGGRESSION_SCORE[tone] ?? 10;
}

function analyzeConversation(messages, userId) {
  if (!messages || messages.length === 0) return null;

  const recent = messages.slice(-20);

  // --- Speaker turn tracking ---
  const lastMsg = messages[messages.length - 1];
  const currentSpeakerId = lastMsg?.user_id;
  const currentSpeakerName = lastMsg?._senderName || (currentSpeakerId === userId ? 'You' : 'Partner');

  // --- Overtalk: consecutive messages from same person ---
  let consecutiveCount = 1;
  let consecutiveSpeaker = messages[messages.length - 1]?.user_id;
  for (let i = messages.length - 2; i >= 0; i--) {
    if (messages[i].user_id === consecutiveSpeaker) consecutiveCount++;
    else break;
  }
  const overtalkUser = consecutiveCount >= OVERTALK_THRESHOLD ? consecutiveSpeaker : null;
  const overtalkName = overtalkUser === userId ? 'You' : 'Your partner';

  // --- Erratic: many messages from one person in short window ---
  const now = Date.now();
  const recentWindow = messages.filter(m => now - new Date(m.created_at).getTime() < ERRATIC_TIME_WINDOW_MS);
  const byUser = {};
  recentWindow.forEach(m => {
    byUser[m.user_id] = (byUser[m.user_id] || 0) + 1;
  });
  const erraticUser = Object.entries(byUser).find(([, count]) => count >= ERRATIC_MSG_THRESHOLD);
  const erraticUserId = erraticUser?.[0];
  const erraticName = erraticUserId === userId ? 'You' : 'Your partner';

  // --- Tone variance (erratic mood swings) ---
  const recentTones = recent.map(m => getToneScore(m.tone_analysis?.tone || 'neutral'));
  let toneVariance = 0;
  if (recentTones.length > 1) {
    for (let i = 1; i < recentTones.length; i++) {
      toneVariance += Math.abs(recentTones[i] - recentTones[i - 1]);
    }
    toneVariance = toneVariance / (recentTones.length - 1);
  }
  const isMoodErratic = toneVariance > 28;

  // --- Aggression: rolling average of last N messages ---
  const rollingMsgs = messages.slice(-AGGRESSION_ROLLING_WINDOW);
  const aggrScores = {};
  rollingMsgs.forEach(m => {
    const uid = m.user_id;
    const score = getToneScore(m.tone_analysis?.tone || 'neutral');
    if (!aggrScores[uid]) aggrScores[uid] = [];
    aggrScores[uid].push(score);
  });
  const aggrByUser = {};
  Object.entries(aggrScores).forEach(([uid, scores]) => {
    aggrByUser[uid] = scores.reduce((a, b) => a + b, 0) / scores.length;
  });

  const aggressiveUserId = Object.entries(aggrByUser).find(([, avg]) => avg >= AGGRESSION_ALERT_SCORE)?.[0];
  const aggressiveName = aggressiveUserId === userId ? 'You' : 'Your partner';
  const maxAggrScore = Math.max(...Object.values(aggrByUser), 0);

  // --- Turn balance ---
  const msgCounts = {};
  messages.forEach(m => { msgCounts[m.user_id] = (msgCounts[m.user_id] || 0) + 1; });
  const userIds = Object.keys(msgCounts);
  const total = messages.length;
  const balanceMap = {};
  userIds.forEach(uid => { balanceMap[uid] = Math.round((msgCounts[uid] / total) * 100); });

  // --- Overall health score (0-100, higher = healthier) ---
  const healthScore = Math.max(0, Math.min(100,
    100 - maxAggrScore * 0.6 - (consecutiveCount > OVERTALK_THRESHOLD ? 15 : 0) - (isMoodErratic ? 10 : 0)
  ));

  // --- Alerts priority queue ---
  const alerts = [];

  if (aggressiveUserId) {
    const severity = getSeverityFromScore(maxAggrScore);
    alerts.push({
      id: 'aggression',
      severity,
      icon: severity === SEVERITY.CRITICAL ? AlertCircle : AlertTriangle,
      title: `${aggressiveName} ${aggressiveUserId === userId ? 'are' : 'is'} sounding aggressive`,
      message: severity === SEVERITY.CRITICAL
        ? `The conversation is escalating. Consider taking a breath before responding.`
        : `Tension is rising. Try reframing with an I-Statement.`,
      score: maxAggrScore,
    });
  }

  if (overtalkUser) {
    alerts.push({
      id: 'overtalk',
      severity: SEVERITY.WARNING,
      icon: Mic,
      title: `${overtalkName} ${overtalkUser === userId ? 'have' : 'has'} sent ${consecutiveCount} messages in a row`,
      message: `Give the other person space to respond. Pause and listen.`,
    });
  }

  if (erraticUserId && erraticUserId !== overtalkUser) {
    alerts.push({
      id: 'erratic',
      severity: SEVERITY.WARNING,
      icon: Activity,
      title: `${erraticName} ${erraticUserId === userId ? 'are' : 'is'} messaging rapidly`,
      message: `Rapid messages can feel overwhelming. Slow down and gather thoughts.`,
    });
  }

  if (isMoodErratic && !aggressiveUserId) {
    alerts.push({
      id: 'mood',
      severity: SEVERITY.INFO,
      icon: TrendingUp,
      title: 'Emotional tone is shifting quickly',
      message: 'The conversation mood is fluctuating. Try to stay grounded.',
    });
  }

  return {
    currentSpeakerId,
    currentSpeakerName,
    consecutiveCount,
    overtalkUser,
    overtalkName,
    erraticUserId,
    erraticName,
    isMoodErratic,
    aggressiveUserId,
    aggressiveName,
    maxAggrScore,
    balanceMap,
    healthScore: Math.round(healthScore),
    alerts,
    userIds,
    msgCounts,
    total,
  };
}

function HealthBar({ score }) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-gray-500">Conversation Health</span>
        <span style={{ color }} className="font-bold">{score}/100</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function SpeakerIndicator({ name, isActive }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-purple-100 border border-purple-300' : 'bg-gray-100 border border-gray-200 opacity-50'}`}>
      <div className="relative">
        <Mic className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
        {isActive && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </div>
      <span className={`text-xs font-semibold ${isActive ? 'text-purple-700' : 'text-gray-400'}`}>{name}</span>
    </div>
  );
}

function TurnBalance({ balanceMap, userId, participants }) {
  const entries = Object.entries(balanceMap);
  if (entries.length < 2) return null;
  const [uid1, pct1] = entries[0];
  const [uid2, pct2] = entries[1] || [null, 0];
  const name1 = uid1 === userId ? 'You' : (participants.find(p => p.user_id === uid1)?.nickname || 'Partner');
  const name2 = uid2 === userId ? 'You' : (participants.find(p => p.user_id === uid2)?.nickname || 'Partner');

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500 font-medium">
        <span>{name1}</span>
        <span className="text-gray-400">Turn Balance</span>
        <span>{name2}</span>
      </div>
      <div className="flex w-full h-2.5 rounded-full overflow-hidden gap-0.5">
        <motion.div className="h-full bg-purple-500 rounded-l-full" animate={{ width: `${pct1}%` }} transition={{ duration: 0.8 }} />
        <motion.div className="h-full bg-pink-400 rounded-r-full" animate={{ width: `${pct2}%` }} transition={{ duration: 0.8 }} />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{pct1}%</span>
        <span>{pct2}%</span>
      </div>
    </div>
  );
}

function AlertBadge({ alert }) {
  const colors = {
    [SEVERITY.CRITICAL]: { bg: 'bg-red-50', border: 'border-red-300', icon: 'text-red-600', title: 'text-red-800', msg: 'text-red-600' },
    [SEVERITY.WARNING]: { bg: 'bg-amber-50', border: 'border-amber-300', icon: 'text-amber-600', title: 'text-amber-800', msg: 'text-amber-600' },
    [SEVERITY.INFO]: { bg: 'bg-blue-50', border: 'border-blue-300', icon: 'text-blue-500', title: 'text-blue-700', msg: 'text-blue-500' },
  };
  const c = colors[alert.severity] || colors[SEVERITY.INFO];
  const Icon = alert.icon;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 10, scale: 0.97 }}
      className={`flex gap-3 p-3 rounded-xl border ${c.bg} ${c.border}`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${c.icon}`} />
      <div>
        <p className={`text-xs font-bold ${c.title}`}>{alert.title}</p>
        <p className={`text-xs mt-0.5 ${c.msg}`}>{alert.message}</p>
      </div>
    </motion.div>
  );
}

const ConversationModerator = ({ messages, userId, participants }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [aiTip, setAiTip] = useState('');
  const [isFetchingTip, setIsFetchingTip] = useState(false);
  const prevAlertRef = useRef(null);
  const tipCooldownRef = useRef(0);

  const enrichMessages = useCallback((msgs) => {
    return msgs.map(m => ({
      ...m,
      _senderName: participants.find(p => p.user_id === m.user_id)?.nickname || (m.user_id === userId ? 'You' : 'Partner'),
    }));
  }, [participants, userId]);

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const enriched = enrichMessages(messages);
    const result = analyzeConversation(enriched, userId);
    setAnalysis(result);

    const topAlert = result?.alerts?.[0];
    const alertKey = topAlert ? `${topAlert.id}-${topAlert.severity}` : null;

    const shouldFetchTip =
      topAlert &&
      topAlert.severity !== SEVERITY.INFO &&
      alertKey !== prevAlertRef.current &&
      Date.now() - tipCooldownRef.current > 20000;

    if (shouldFetchTip) {
      prevAlertRef.current = alertKey;
      tipCooldownRef.current = Date.now();
      fetchAITip(topAlert, result);
    }
  }, [messages, userId, enrichMessages]);

  const fetchAITip = async (alert, result) => {
    setIsFetchingTip(true);
    setAiTip('');
    try {
      const recentMsgs = messages.slice(-6).map(m => {
        const name = participants.find(p => p.user_id === m.user_id)?.nickname || (m.user_id === userId ? 'You' : 'Partner');
        return `${name} [${m.tone_analysis?.tone || 'neutral'}]: "${m.message_text}"`;
      }).join('\n');

      const { data, error } = await supabase.functions.invoke('generate-i-statement', {
        body: {
          prompt: `You are an expert couples communication coach acting as a conversation moderator.

SITUATION: ${alert.title}
ALERT TYPE: ${alert.severity} - ${alert.message}
HEALTH SCORE: ${result.healthScore}/100

RECENT MESSAGES:
${recentMsgs}

Give ONE short, empathetic, practical de-escalation suggestion (2 sentences max) for this moment. 
Be direct and actionable. Do not lecture. Address the most pressing issue only.`,
          systemPrompt: "You are a skilled couples therapist and communication mediator providing real-time conversational guidance."
        }
      });

      if (!error && data?.iStatement) {
        setAiTip(data.iStatement);
      }
    } catch (e) {
      console.warn('Moderator AI tip failed:', e);
    } finally {
      setIsFetchingTip(false);
    }
  };

  if (!analysis || messages.length < 2) return null;

  const { healthScore, alerts, currentSpeakerName, balanceMap, consecutiveCount } = analysis;
  const topSeverity = alerts[0]?.severity || SEVERITY.NONE;
  const headerColor = {
    [SEVERITY.CRITICAL]: 'from-red-500 to-rose-600',
    [SEVERITY.WARNING]: 'from-amber-500 to-orange-500',
    [SEVERITY.INFO]: 'from-blue-500 to-indigo-500',
    [SEVERITY.NONE]: 'from-purple-500 to-violet-600',
  }[topSeverity];

  const speakerName = currentSpeakerName;
  const otherName = speakerName === 'You' ? 'Partner' : 'You';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden shadow-lg border border-white/20 mb-4"
    >
      <button
        onClick={() => setIsExpanded(prev => !prev)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r ${headerColor} text-white`}
      >
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <span className="font-bold text-sm tracking-wide">AI Conversation Moderator</span>
          {alerts.length > 0 && (
            <span className="bg-white/30 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {alerts.length} alert{alerts.length > 1 ? 's' : ''}
            </span>
          )}
          {topSeverity === SEVERITY.CRITICAL && (
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="text-lg"
            >⚠️</motion.span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${healthScore >= 70 ? 'bg-green-400/30' : healthScore >= 40 ? 'bg-yellow-300/30' : 'bg-red-300/30'}`}>
            Health {healthScore}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white/95 backdrop-blur-sm px-4 py-4 space-y-4"
          >
            {/* Current Speaker */}
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                <Mic className="w-3 h-3" /> Current Speaker
              </p>
              <div className="flex gap-2">
                <SpeakerIndicator name={speakerName} isActive={true} />
                <SpeakerIndicator name={otherName} isActive={false} />
              </div>
              {consecutiveCount >= OVERTALK_THRESHOLD && (
                <p className="text-xs text-amber-600 mt-1 font-medium">
                  {speakerName} {speakerName === 'You' ? 'have' : 'has'} sent {consecutiveCount} messages without a reply.
                </p>
              )}
            </div>

            {/* Health + Balance */}
            <div className="space-y-3">
              <HealthBar score={healthScore} />
              <TurnBalance balanceMap={balanceMap} userId={userId} participants={participants} />
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Active Alerts
                </p>
                <AnimatePresence mode="sync">
                  {alerts.map(alert => (
                    <AlertBadge key={alert.id} alert={alert} />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* AI Tip */}
            <AnimatePresence>
              {(isFetchingTip || aiTip) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-purple-200"
                >
                  <p className="text-xs font-bold text-purple-700 flex items-center gap-1 mb-1">
                    <Zap className="w-3 h-3" /> Moderator Suggestion
                  </p>
                  {isFetchingTip ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-purple-500">Generating guidance...</span>
                    </div>
                  ) : (
                    <p className="text-xs text-purple-800 leading-relaxed">{aiTip}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {alerts.length === 0 && !aiTip && (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-xs font-medium">Conversation flowing well — no issues detected.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ConversationModerator;
