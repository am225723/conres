import React from 'react';
import { Sparkles, Heart, Brain, Shield } from 'lucide-react';

export const EMOTIONS = [
  "hurt","frustrated","worried","unseen","dismissed","lonely","overwhelmed",
  "annoyed","tense","insecure","jealous","sad","disappointed","confused",
  "resentful","tired","anxious","embarrassed","guilty","angry"
];

export const NEEDS = [
  "respect","trust","security","attention","affection","consistency","space",
  "honesty","teamwork","reassurance","autonomy","romance","stability","clarity",
  "appreciation","quality time","support","fairness","play","listening"
];

export const EXERCISES = [
  "10 seconds of shared silence + eye contact before speaking",
  "Reflect back one sentence you heard before replying",
  "Start with one gratitude about the other person",
  "Keep your statement under 25 seconds, then pause",
  "Ask: 'Is now a good time for a 5-minute talk?'"
];

export const AFFIRMATIONS = [
  "Your feelings are valid and deserve to be heard",
  "You have the power to communicate with love and clarity",
  "Every conversation is an opportunity to deepen connection",
  "You are worthy of respect and understanding",
  "Your voice matters and your needs are important"
];

export const BADGE_DEFINITIONS = [
    { 
        minCount: 1, 
        badge: { icon: Sparkles, name: "First Step", desc: "Created your first I-statement" }
    },
    { 
        minCount: 3, 
        badge: { icon: Brain, name: "Clarity Crafter", desc: "Practiced 3+ times" }
    },
    { 
        minCount: 5, 
        badge: { icon: Heart, name: "Empathy Weaver", desc: "Built 5+ compassionate statements" }
    },
    { 
        check: (needs) => needs.includes("reassurance"), 
        badge: { icon: Shield, name: "Safety Seeker", desc: "Named your need for security" }
    }
];