import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from 'lucide-react';

export function HistoryTab({ insights, history }) {
  return (
    <div className="space-y-6">
      <Card className="glass-card border-border">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Your Pattern Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded bg-card/50 border border-border/50">
              <div className="text-xl font-bold text-foreground">{insights.total}</div>
              <div className="text-sm text-foreground/70">Statements Created</div>
            </div>
            <div className="p-3 rounded bg-card/50 border border-border/50">
              <div className="text-sm font-bold text-foreground truncate">{insights.topEmotions}</div>
              <div className="text-sm text-foreground/70">Top Emotions</div>
            </div>
            <div className="p-3 rounded bg-card/50 border border-border/50">
              <div className="text-sm font-bold text-foreground truncate">{insights.topNeeds}</div>
              <div className="text-sm text-foreground/70">Top Needs</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card className="glass-card border-border">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Statement History</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map((entry, idx) => (
                <motion.div
                  key={entry.ts}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 rounded bg-card/50 border border-border/50"
                >
                  <p className="text-foreground/90 font-medium">"{entry.statement}"</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {entry.emotions.map((emotion) => (
                      <span key={emotion} className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-700">
                        {emotion}
                      </span>
                    ))}
                    {entry.needs.map((need) => (
                      <span key={need} className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-700">
                        {need}
                      </span>
                    ))}
                  </div>
                  <p className="text-foreground/50 text-xs mt-2">
                    {new Date(entry.ts).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}