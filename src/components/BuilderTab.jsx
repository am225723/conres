import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Star, Zap, CheckCircle, Download } from 'lucide-react';

export function BuilderTab({
  feeling, setFeeling,
  situation, setSituation,
  because, setBecause,
  request, setRequest,
  firmness, setFirmness,
  generateAll,
  statement,
  prompt1, prompt2, prompt3,
  saveStatement, exportSession,
  impactPreview
}) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="glass-card border-border">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Build Your I-Statement
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">I feel...</label>
              <Input
                value={feeling}
                onChange={(e) => setFeeling(e.target.value)}
                placeholder="hurt, frustrated, worried..."
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">When...</label>
              <Textarea
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="Describe the specific situation..."
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Because...</label>
              <Textarea
                value={because}
                onChange={(e) => setBecause(e.target.value)}
                placeholder="Explain the impact on you..."
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Could we... (Request)</label>
              <Input
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                placeholder="talk about this, find a solution..."
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tone Firmness: {firmness[0]}%</label>
              <Slider
                value={firmness}
                onValueChange={setFirmness}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-foreground/80 mt-1">
                <span>Gentle</span>
                <span>Balanced</span>
                <span>Assertive</span>
              </div>
            </div>
            <Button
              onClick={generateAll}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground"
            >
              <Zap className="w-4 h-4 mr-2" />
              Generate Statement
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Your I-Statement
          </h2>
          <AnimatePresence>
            {statement && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20"
              >
                <p className="text-foreground font-medium leading-relaxed">"{statement}"</p>
                 <div className="mt-3 p-2 rounded bg-card/50 text-xs text-foreground/80 border border-border/50">
                    <strong>Impact Preview:</strong> {impactPreview}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {prompt1 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">AI-Generated Prompts:</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <div className="p-3 rounded bg-background/50 border border-border/50">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{prompt1}</p>
                </div>
                <div className="p-3 rounded bg-background/50 border border-border/50">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{prompt2}</p>
                </div>
                <div className="p-3 rounded bg-background/50 border border-border/50">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{prompt3}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              onClick={saveStatement}
              variant="outline"
              className="flex-1 border-border text-foreground hover:bg-muted"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              onClick={exportSession}
              variant="outline"
              className="border-border text-foreground hover:bg-muted"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}