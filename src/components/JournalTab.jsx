import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Laptop as NotebookPen } from 'lucide-react';

export function JournalTab({
  journalEntry, setJournalEntry,
  addJournalEntry, journal
}) {
  return (
    <div className="space-y-6">
      <Card className="glass-card border-border">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <NotebookPen className="w-5 h-5 text-orange-500" />
            Reflection Journal
          </h2>
          <Textarea
            value={journalEntry}
            onChange={(e) => setJournalEntry(e.target.value)}
            placeholder="How are you feeling about your communication today? What insights have you gained?"
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            rows={4}
          />
          <Button
            onClick={addJournalEntry}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-primary-foreground"
          >
            <NotebookPen className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
        </CardContent>
      </Card>

      {journal.length > 0 && (
        <Card className="glass-card border-border">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Entries</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {journal.map((entry, idx) => (
                <motion.div
                  key={entry.ts}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-3 rounded bg-card/50 border border-border/50"
                >
                  <p className="text-foreground/90 text-sm">{entry.text}</p>
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