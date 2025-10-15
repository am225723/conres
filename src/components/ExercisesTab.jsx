import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, RefreshCw, Brain, Sparkles } from 'lucide-react';
import { EXERCISES } from '@/lib/constants';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";


export function ExercisesTab({
  currentExercise, nextExercise,
  handleCheckin, checkin, tip,
}) {
  return (
    <div className="space-y-6">
      <Card className="glass-card border-border">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Communication Exercises
          </h2>
          <motion.div
            key={currentExercise}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/20"
          >
            <p className="text-foreground font-medium">
              Exercise {currentExercise + 1}: {EXERCISES[currentExercise]}
            </p>
          </motion.div>
          <Button
            onClick={nextExercise}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-primary-foreground"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Next Exercise
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card border-border">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Emotional State Check-in
          </h2>
           <Select value={checkin} onValueChange={handleCheckin}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue placeholder="How are you feeling right now?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calm">Calm</SelectItem>
                <SelectItem value="hopeful">Hopeful</SelectItem>
                <SelectItem value="tense">Tense</SelectItem>
                <SelectItem value="anxious">Anxious</SelectItem>
              </SelectContent>
            </Select>
          {tip && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-400/20"
            >
              <p className="text-foreground italic">💡 {tip}</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}