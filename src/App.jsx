import React, { useMemo, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { BADGE_DEFINITIONS, EXERCISES } from '@/lib/constants';

import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { BuilderTab } from '@/components/BuilderTab';
import { EmotionsTab } from '@/components/EmotionsTab';
import { RolePlayTab } from '@/components/RolePlayTab';
import { ExercisesTab } from '@/components/ExercisesTab';
import { JournalTab } from '@/components/JournalTab';
import { HistoryTab } from '@/components/HistoryTab';
import CouplesTexting from '@/components/CouplesTexting';
import { ConversationDashboard } from '@/components/ConversationDashboard';
import AIStatementBuilder from '@/components/AIStatementBuilder';
import AIRolePlayer from '@/components/AIRolePlayer';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

const MainApp = () => {
  const { toast } = useToast();

  const [feeling, setFeeling] = useState("");
  const [situation, setSituation] = useState("");
  const [because, setBecause] = useState("");
  const [request, setRequest] = useState("");
  const [scenario, setScenario] = useState("relationship");
  const [tone, setTone] = useState("empathetic");
  const [normal, setNormal] = useState("");
  const [pickedEmotions, setPickedEmotions] = useState([]);
  const [pickedNeeds, setPickedNeeds] = useState([]);
  const [insecurityNotes, setInsecurityNotes] = useState("");
  const [firmness, setFirmness] = useState([30]);
  const [statement, setStatement] = useState("");
  const [prompt1, setPrompt1] = useState("");
  const [prompt2, setPrompt2] = useState("");
  const [prompt3, setPrompt3] = useState("");
  const [aiResponse1, setAiResponse1] = useState("");
  const [aiResponse2, setAiResponse2] = useState("");
  const [aiResponse3, setAiResponse3] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roleplayStyle, setRoleplayStyle] = useState("supportive");
  const [partnerReply, setPartnerReply] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState([]);
  const [journalEntry, setJournalEntry] = useState("");
  const [journal, setJournal] = useState([]);
  const [checkin, setCheckin] = useState("");
  const [tip, setTip] = useState("");
  const [couplesMode, setCouplesMode] = useState(false);
  const [partnerFeeling, setPartnerFeeling] = useState("");
  const [partnerSituation, setPartnerSituation] = useState("");
  const [partnerBecause, setPartnerBecause] = useState("");
  const [partnerRequest, setPartnerRequest] = useState("");
  const [currentExercise, setCurrentExercise] = useState(0);

  const badges = useMemo(() => {
    const unlocked = [];
    const count = history.length;
    BADGE_DEFINITIONS.forEach(def => {
        if (def.minCount && count >= def.minCount) {
            unlocked.push(def.badge);
        } else if (def.check && def.check(pickedNeeds)) {
            unlocked.push(def.badge);
        }
    });
    return unlocked;
  }, [history.length, pickedNeeds]);

  const toggleEmotion = (emotion) => {
    setPickedEmotions(prev =>
      prev.includes(emotion) ? prev.filter(e => e !== emotion) : [...prev, emotion]
    );
  };

  const toggleNeed = (need) => {
    setPickedNeeds(prev =>
      prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]
    );
  };

  const constructStatement = useCallback(() => {
    const emo = pickedEmotions.length ? pickedEmotions.join(", ") : feeling || "[emotion]";
    const nds = pickedNeeds.length ? ` It touches on my need for ${pickedNeeds.join(", ")}.` : "";
    let s = `I feel ${emo} when ${situation || "[situation]"} because ${because || "[impact]"}.`;
    if (request) s += ` I would like ${request}.`;
    s += nds;
    setStatement(s);
  }, [feeling, situation, because, request, pickedEmotions, pickedNeeds]);

  const buildPrompt1 = useCallback(() => {
    const p = `You are an expert in communication coaching, conflict resolution, and relationship psychology. Your role is to help the user build a refined I-Statement that turns tension into connection. The goal: a message that is empathetic, clear, culturally sensitive, adapted to the chosen scenario (romantic, family, friendship, workplace, or roommate). Tone can be empathetic, assertive, professional, or neutral. Context: ${scenario}\nTone: ${tone} (firmness ${firmness[0]}/100)\n\n🎨 Structure:\n1. Rewrite the I-statement in the selected tone and context, warm & non-blaming.\n2. Suggest 2 alternatives: softer (gentle & empathetic) and more direct (clear & assertive).\n3. Flag vague or blaming language, show neutral/self-focused replacements.\n4. Use an emotion lens: refine broad feelings (“angry” → “frustrated,” “hurt”).\n\n⚡ Inputs:\n- Feeling: ${feeling || pickedEmotions.join(", ") || "[user input here]"}\n- Situation: ${situation || "[user input here]"}\n- Because: ${because || "[user input here]"}\n- Request: ${request || "[user input here]"}\n- Needs: ${pickedNeeds.length ? pickedNeeds.join(", ") : "[optional]"}\n- Insecurity Notes: ${insecurityNotes || "[optional]"}\n\n🌐 Guidance:\n- Romantic → care, vulnerability.\n- Family → respectful, inclusive.\n- Friendship → supportive, loyal.\n- Workplace → professional, clear.\n- Roommates → cooperative, pragmatic.\n\n✨ Output:\n- Refined I-statement (with context & tone).\n- Softer phrasing.\n- Direct phrasing.\n- Corrections for vague/blaming words.\n- Emotional refinements.\n\nKeep it artful, intelligent, uplifting.`;
    setPrompt1(p);
    return p;
  }, [scenario, tone, firmness, feeling, situation, because, request, pickedEmotions, pickedNeeds, insecurityNotes]);

  const buildPrompt2 = useCallback(() => {
    const p = `Continue with deeper coaching on the refined I-statement.\n\n🎭 Next:\n5. Provide Empathy Mirror Response → what the other might hear/feel.\n6. Suggest dialogue steps → listening prompts, follow-up Qs, ways to check understanding.\n7. Offer 2 culturally sensitive (global English) variations.\n\n🤹 Practice:\n8. Show role-play delivery: calm body language, breathing, pacing, tone.\n9. Give feedback tips if harsh (“This may sound like blame—reframe as ‘I feel’”).\n\n📓 Growth:\n10. Suggest a conflict resolution journal → track what worked, what to try next.\n11. Remind: practicing I-statements builds emotional intelligence.\n\n🌸 Reminder (choose one line):\n- “Speak from the heart, not the wound.”\n- “Clarity with compassion is connection.”\n- “Empathy bridges your truth and theirs.”\n\nKeep it elegant, attuned, empowering.`;
    setPrompt2(p);
    return p;
  }, []);

  const buildPrompt3 = useCallback(() => {
    const p = `You are a compassionate communication coach. The user will type what they’d normally say in conflict (may sound blaming, harsh, reactive).\n\nTask: Reword into a balanced I-statement with empathy, clarity, constructive tone.\n\nUser’s input:\n"""\n${normal || "[user’s raw statement here]"}\n"""\n\nSteps:\n1. Show original statement.\n2. Identify underlying emotions/needs.\n3. Rewrite as I-statement:\n   - I feel [emotion] when [situation] because [impact].\n   - Optionally: I would like [request].\n4. Provide 2 variations:\n   - Softer, empathetic.\n   - Direct, assertive.\n5. Explain how reframing shifts tone.\n6. Give one-sentence Empathy Mirror.\n7. Offer global-English version.\n\nKeep it elegant, empathetic, culturally sensitive.`;
    setPrompt3(p);
    return p;
  }, [normal]);

  const generateAICompletions = async (prompt, setter) => {
    try {
      const { callAI } = await import('./lib/aiService');
      const content = await callAI(prompt);
      setter(content);
    } catch (e) {
      console.error(e);
      setError(e.message);
      toast({ title: "Error Generating Response", description: e.message, variant: "destructive" });
      throw e;
    }
  };

  const generateAll = useCallback(async () => {
    constructStatement();
    setIsLoading(true);
    setError(null);
    setAiResponse1("");
    setAiResponse2("");
    setAiResponse3("");

    const p1 = buildPrompt1();
    const p2 = buildPrompt2();
    const p3 = buildPrompt3();

    try {
      await Promise.all([
        generateAICompletions(p1, setAiResponse1),
        generateAICompletions(p2, setAiResponse2),
        generateAICompletions(p3, setAiResponse3),
      ]);
      toast({ title: "AI-Powered Suggestions Ready! 🚀", description: "Your statement has been enhanced by AI." });
    } catch (e) {
      // Error is already handled in generateAICompletions
    } finally {
      setIsLoading(false);
    }
  }, [constructStatement, buildPrompt1, buildPrompt2, buildPrompt3, toast]);

  const simulatePartner = () => {
    let reply = "";
    switch (roleplayStyle) {
      case "supportive": reply = `I hear you. Thank you for telling me. I didn’t realize this was impacting you. Can you tell me what would help right now?`; break;
      case "defensive": reply = `I don’t think that’s fair. I’m trying my best. Why are you blaming me?`; break;
      case "dismissive": reply = `This again? I think you’re overreacting. Can we drop it?`; break;
      case "curious": reply = `I want to understand. When does this feel the worst for you? What would support look like?`; break;
      default: reply = `Okay. Can we talk more about what you need?`;
    }
    setPartnerReply(`Partner (${roleplayStyle}): ${reply}`);
    setIsPlaying(true);
    toast({ title: "Role-play Started!", description: `Simulating a ${roleplayStyle} partner.` });
  };
  const stopRoleplay = () => {
    setIsPlaying(false);
    setPartnerReply("");
    toast({ title: "Role-play Stopped", description: "Ready for the next simulation." });
  };

  const impactPreview = useMemo(() => {
    if (!statement) return "—";
    const isAccusatory = /\byou\b(?!.*I feel)/i.test(statement) && /never|always|should|fault/i.test(statement);
    const firmnessLabel = firmness[0] < 40 ? "gentle" : firmness[0] < 70 ? "balanced" : "firm";
    return `Tone reads ${firmnessLabel}. ${isAccusatory ? "Note: may sound blaming — consider focusing more on 'I feel' + a concrete request." : "Likely to be received as self-focused and constructive."}`;
  }, [statement, firmness]);

  const saveStatement = () => {
    if (!statement.trim()){
       toast({ title: "Empty Statement", description: "Please generate a statement first.", variant: "destructive" });
       return;
    }
    setHistory((h) => [{ ts: Date.now(), statement, emotions: pickedEmotions, needs: pickedNeeds }, ...h].slice(0, 50));
    toast({ title: "Statement Saved!", description: "Your progress has been recorded in History." });
  };

  const insights = useMemo(() => {
    const emoCount = {};
    const needCount = {};
    history.forEach((h) => {
      h.emotions.forEach((e) => (emoCount[e] = (emoCount[e] || 0) + 1));
      h.needs.forEach((n) => (needCount[n] = (needCount[n] || 0) + 1));
    });
    const topEmotions = Object.entries(emoCount).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=>`${k} (${v})`).join(", ");
    const topNeeds = Object.entries(needCount).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=>`${k} (${v})`).join(", ");
    return { topEmotions: topEmotions || "—", topNeeds: topNeeds || "—", total: history.length };
  }, [history]);

  const affirmation = useMemo(() => {
    if (pickedNeeds.includes("reassurance")) return "I am worthy of consistent love and clear reassurance.";
    if (pickedNeeds.includes("respect")) return "My feelings matter; I speak with calm confidence.";
    if (pickedNeeds.includes("security")) return "I can ask for safety and stability and still be loved.";
    return "I can be clear and kind at the same time.";
  }, [pickedNeeds]);

  const handleCheckin = (val) => {
    setCheckin(val);
    if (val === "anxious") setTip("Try 4-7-8 breathing and start with: ‘I want us to feel close while we talk.’");
    else if (val === "tense") setTip("Lower the firmness slider 10 points and add one gratitude before your request.");
    else if (val === "calm") setTip("Great moment to have the talk. Keep it short, then listen.");
    else if (val === "hopeful") setTip("Name one small, specific request that’s easy to say yes to.");
    else setTip("");
  };

  const mergedCouplesView = useMemo(() => {
    if (!couplesMode) return "";
    const mine = statement || `I feel ${feeling || "[emotion]"} when ${situation || "[situation]"} because ${because || "[impact]"}. ${request ? "I would like " + request + "." : ""}`;
    const theirs = `I feel ${partnerFeeling || "[emotion]"} when ${partnerSituation || "[situation]"} because ${partnerBecause || "[impact]"}. ${partnerRequest ? "I would like " + partnerRequest + "." : ""}`;
    return `You → ${mine}\nPartner → ${theirs}\n\nShared next step: Choose one small change you both can try this week.`;
  }, [couplesMode, statement, feeling, situation, because, request, partnerFeeling, partnerSituation, partnerBecause, partnerRequest]);

  const exportSession = () => {
    const data = {
      statement, scenario, tone,
      emotions: pickedEmotions, needs: pickedNeeds, insecurityNotes,
      normal, journal, history,
      prompts: { prompt1, prompt2, prompt3 },
      aiResponses: { aiResponse1, aiResponse2, aiResponse3 },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `i_statement_session_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Session Exported!", description: "A JSON file has been downloaded." });
  };

  const addJournalEntry = () => {
    if (!journalEntry.trim()) {
      toast({ title: "Empty Entry", description: "Please write something in your journal first!", variant: "destructive" });
      return;
    }
    const newEntry = { ts: Date.now(), text: journalEntry };
    setJournal(prev => [newEntry, ...prev]);
    setJournalEntry("");
    toast({ title: "Journal Entry Added! 📝", description: "Your thoughts have been saved." });
  };

  const nextExercise = () => {
    setCurrentExercise((prev) => (prev + 1) % EXERCISES.length);
    toast({ title: "New Exercise! 🎯", description: "Try this communication technique." });
  };

  const propsBuilder = {
    feeling, setFeeling, situation, setSituation, because, setBecause, request, setRequest,
    firmness, setFirmness, generateAll, statement, prompt1, prompt2, prompt3,
    aiResponse1, aiResponse2, aiResponse3, isLoading, error, saveStatement,
    exportSession, impactPreview
  };

  const [customAffirmation, setCustomAffirmation] = useState('');
  const propsEmotions = { pickedEmotions, toggleEmotion, pickedNeeds, toggleNeed, insecurityNotes, setInsecurityNotes, affirmation: customAffirmation || affirmation, setAffirmation: setCustomAffirmation };

  const propsRoleplay = {
    roleplayStyle, setRoleplayStyle, simulatePartner, stopRoleplay, partnerReply, isPlaying,
    couplesMode, setCouplesMode, partnerFeeling, setPartnerFeeling, partnerSituation,
    setPartnerSituation, partnerBecause, setPartnerBecause, partnerRequest, setPartnerRequest, mergedCouplesView
  };

  const propsExercises = { currentExercise, nextExercise, handleCheckin, checkin, tip };
  const propsJournal = { journalEntry, setJournalEntry, addJournalEntry, journal };
  const propsHistory = { insights, history };

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="md:ml-[240px] transition-all duration-300">
        <div className="p-4 space-y-6">
          <Header logoSrc="https://horizons-cdn.hostinger.com/072b7eea-05b1-4460-9b36-68b9a8e786c7/1afbcf7cdc983bde44c229eaafbd4b60.png" badges={badges} />
          <div className="w-full max-w-6xl mx-auto space-y-6">
        <Routes>
          <Route path="/" element={<BuilderTab {...propsBuilder} />} />
          <Route path="/emotions" element={<EmotionsTab {...propsEmotions} />} />
          <Route path="/roleplay" element={<RolePlayTab {...propsRoleplay} />} />
          <Route path="/ai-roleplay" element={<AIRolePlayer />} />
          <Route path="/ai-builder" element={<AIStatementBuilder />} />
          <Route path="/dashboard" element={<ConversationDashboard />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/exercises" element={<ExercisesTab {...propsExercises} />} />
          <Route path="/journal" element={<JournalTab {...propsJournal} />} />
          <Route path="/history" element={<HistoryTab {...propsHistory} />} />
          </Routes>
          </div>
        </div>
      </div>
    </div>
  )
};

export default function App() {
  return (
    <>
      <Helmet>
        <title>I-Statement Builder - Transform Your Communication</title>
        <meta name="description" content="Build powerful I-statements for better relationships. Practice empathetic communication with guided exercises, role-play scenarios, and emotional intelligence tools." />
        <meta property="og:title" content="I-Statement Builder - Transform Your Communication" />
        <meta property="og:description" content="Build powerful I-statements for better relationships. Practice empathetic communication with guided exercises, role-play scenarios, and emotional intelligence tools." />
      </Helmet>
      <Toaster />
      <Routes>
        <Route path="/*" element={<MainApp />} />
        <Route path="/couples/:sessionId" element={<CouplesTexting />} />
        <Route path="/couples" element={<CouplesTexting />} />
      </Routes>
    </>
  );
}
