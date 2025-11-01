export const calculateHealthScore = (messages) => {
  if (!messages || messages.length === 0) return { score: 100, level: 'excellent' };

  const toneWeights = {
    'calm': 10,
    'reassuring': 9,
    'empathetic': 9,
    'compassionate': 9,
    'cooperative': 8,
    'curious': 7,
    'assertive': 6,
    'passive-aggressive': -3,
    'sarcastic': -4,
    'anxious': -2,
    'impatient': -3,
    'dismissive': -5,
    'judgmental': -6,
    'blaming': -7,
    'confrontational': -8,
    'aggressive': -9,
    'hostile': -10
  };

  let totalScore = 0;
  messages.forEach(msg => {
    const tone = msg.tone_analysis?.tone || 'calm';
    totalScore += toneWeights[tone] || 0;
  });

  const averageScore = totalScore / messages.length;
  const normalizedScore = Math.max(0, Math.min(100, 50 + (averageScore * 5)));

  let level = 'excellent';
  if (normalizedScore < 30) level = 'needs-attention';
  else if (normalizedScore < 50) level = 'fair';
  else if (normalizedScore < 70) level = 'good';

  return { score: Math.round(normalizedScore), level };
};

export const getToneDistribution = (messages) => {
  const distribution = {};
  messages.forEach(msg => {
    const tone = msg.tone_analysis?.tone || 'calm';
    distribution[tone] = (distribution[tone] || 0) + 1;
  });
  return distribution;
};

export const getConflictPatterns = (messages) => {
  const patterns = [];
  let consecutiveNegative = 0;

  messages.forEach((msg, index) => {
    const tone = msg.tone_analysis?.tone || 'calm';
    const isNegative = ['passive-aggressive', 'sarcastic', 'dismissive', 'judgmental', 
                        'blaming', 'confrontational', 'aggressive', 'hostile'].includes(tone);

    if (isNegative) {
      consecutiveNegative++;
      if (consecutiveNegative >= 3) {
        patterns.push({
          type: 'escalation',
          startIndex: index - 2,
          message: 'Conversation escalated with 3+ negative messages in a row'
        });
      }
    } else {
      consecutiveNegative = 0;
    }
  });

  return patterns;
};

export const getTimeBasedInsights = (messages) => {
  const hourCounts = new Array(24).fill(0);
  const dayCounts = new Array(7).fill(0);
  const conflictHours = {};
  const conflictDays = {};

  messages.forEach(msg => {
    const date = new Date(msg.created_at);
    const hour = date.getHours();
    const day = date.getDay();
    const tone = msg.tone_analysis?.tone || 'calm';
    const isConflict = ['confrontational', 'aggressive', 'hostile', 'blaming'].includes(tone);

    hourCounts[hour]++;
    dayCounts[day]++;

    if (isConflict) {
      conflictHours[hour] = (conflictHours[hour] || 0) + 1;
      conflictDays[day] = (conflictDays[day] || 0) + 1;
    }
  });

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
    dayCounts.indexOf(Math.max(...dayCounts))
  ];

  const conflictPeakHour = Object.keys(conflictHours).reduce((a, b) => 
    conflictHours[a] > conflictHours[b] ? a : b, 0);

  return { peakHour, peakDay, conflictPeakHour, hourCounts, dayCounts };
};

export const getWeeklyProgress = (messages) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentMessages = messages.filter(msg => 
    new Date(msg.created_at) >= oneWeekAgo
  );

  const currentScore = calculateHealthScore(recentMessages);
  
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  const previousWeekMessages = messages.filter(msg => {
    const date = new Date(msg.created_at);
    return date >= twoWeeksAgo && date < oneWeekAgo;
  });

  const previousScore = calculateHealthScore(previousWeekMessages);

  return {
    current: currentScore.score,
    previous: previousScore.score,
    improvement: currentScore.score - previousScore.score,
    trend: currentScore.score > previousScore.score ? 'improving' : 
           currentScore.score < previousScore.score ? 'declining' : 'stable'
  };
};
