import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Pill } from '@/components/Pill';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Target, Shield, Sparkles, Play, Loader2 } from 'lucide-react';
import { EMOTIONS, NEEDS } from '@/lib/constants';
import HealingAnimation from './HealingAnimation';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';

export function EmotionsTab({
  pickedEmotions, toggleEmotion,
  pickedNeeds, toggleNeed,
  insecurityNotes, setInsecurityNotes,
  affirmation, setAffirmation
}) {
  const [showHealing, setShowHealing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiAffirmation, setAiAffirmation] = useState('');

  const generateAIAffirmation = async () => {
    if (pickedEmotions.length === 0) {
      toast.error('Please select at least one emotion first');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-i-statement', {
        body: { 
          text: `Generate a healing affirmation for someone feeling: ${pickedEmotions.join(', ')}.
Their needs are: ${pickedNeeds.join(', ') || 'not specified'}.
Their insecurities: ${insecurityNotes || 'not specified'}.

Create a warm, personalized affirmation (2-3 sentences) that:
1. Validates their feelings
2. Offers comfort and hope
3. Affirms their worth

Return ONLY the affirmation text, nothing else.`
        }
      });

      if (error) throw error;
      setAiAffirmation(data.iStatement || affirmation);
      if (setAffirmation) setAffirmation(data.iStatement);
    } catch (error) {
      console.error('AI error:', error);
      toast.error('Could not generate affirmation');
    } finally {
      setIsGenerating(false);
    }
  };

  const startHealingJourney = async () => {
    if (pickedEmotions.length === 0) {
      toast.error('Please select at least one emotion first');
      return;
    }

    await generateAIAffirmation();
    setShowHealing(true);
  };

  const handleHealingComplete = async () => {
    setShowHealing(false);
    toast.success('Healing session complete. Remember: You are worthy of love and peace.');
    
    try {
      await supabase.from('conres_emotion_tracking').insert([{
        emotions: pickedEmotions,
        needs: pickedNeeds,
        insecurity_notes: insecurityNotes,
        affirmation: aiAffirmation || affirmation,
        healing_completed: true
      }]);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const primaryEmotion = pickedEmotions[0]?.toLowerCase() || 'calm';

  return (
    <>
      <AnimatePresence>
        {showHealing && (
          <HealingAnimation 
            isActive={showHealing}
            emotion={primaryEmotion}
            onComplete={handleHealingComplete}
          />
        )}
      </AnimatePresence>

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

        <Card className="glass-card border-border overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Healing Affirmations
              </h2>
              <Button 
                onClick={generateAIAffirmation}
                disabled={isGenerating || pickedEmotions.length === 0}
                variant="outline"
                size="sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1" />
                    Generate AI Affirmation
                  </>
                )}
              </Button>
            </div>
            
            <motion.div
              key={aiAffirmation || affirmation}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 rounded-lg bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-400/20"
            >
              <p className="text-foreground italic text-lg">"{aiAffirmation || affirmation}"</p>
            </motion.div>

            <Button
              onClick={startHealingJourney}
              disabled={pickedEmotions.length === 0}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Healing Journey
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              A guided visualization to help process your emotions
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
