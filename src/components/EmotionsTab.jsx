import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Pill } from '@/components/Pill';
import { motion } from 'framer-motion';
import { Heart, Target, Shield, Sparkles } from 'lucide-react';
import { EMOTIONS, NEEDS } from '@/lib/constants';

export function EmotionsTab({
  pickedEmotions, toggleEmotion,
  pickedNeeds, toggleNeed,
  insecurityNotes, setInsecurityNotes,
  affirmation
}) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card border-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Emotion Explorer
            </h2>
            <p className="text-foreground/80 text-sm">Select emotions that resonate with your experience:</p>
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map((emotion) => (
                <Pill
                  key={emotion}
                  label={emotion}
                  selected={pickedEmotions.includes(emotion)}
                  onClick={() => toggleEmotion(emotion)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              Needs Identifier
            </h2>
            <p className="text-foreground/80 text-sm">What do you need most right now?</p>
            <div className="flex flex-wrap gap-2">
              {NEEDS.map((need) => (
                <Pill
                  key={need}
                  label={need}
                  selected={pickedNeeds.includes(need)}
                  onClick={() => toggleNeed(need)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-border">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Insecurity Reflection
          </h2>
          <p className="text-foreground/80 text-sm">What insecurities or fears might be influencing this situation?</p>
          <Textarea
            value={insecurityNotes}
            onChange={(e) => setInsecurityNotes(e.target.value)}
            placeholder="I'm afraid that... I worry about... I feel insecure when..."
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            rows={4}
          />
        </CardContent>
      </Card>

      <Card className="glass-card border-border">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Healing Affirmations
          </h2>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-3 rounded-lg bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-400/20"
          >
            <p className="text-foreground italic">"{affirmation}"</p>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}