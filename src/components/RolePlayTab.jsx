import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Users, Play, MessageSquare as MessageSquareHeart, Heart, Square } from 'lucide-react';

export function RolePlayTab({
  roleplayStyle, setRoleplayStyle,
  simulatePartner,
  partnerReply,
  couplesMode, setCouplesMode,
  partnerFeeling, setPartnerFeeling,
  partnerSituation, setPartnerSituation,
  partnerBecause, setPartnerBecause,
  partnerRequest, setPartnerRequest,
  isPlaying, stopRoleplay, mergedCouplesView
}) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card border-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Practice Simulator
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Partner Response Style</label>
                <Select value={roleplayStyle} onValueChange={setRoleplayStyle}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supportive">Supportive</SelectItem>
                    <SelectItem value="defensive">Defensive</SelectItem>
                    <SelectItem value="dismissive">Dismissive</SelectItem>
                    <SelectItem value="curious">Curious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={isPlaying ? stopRoleplay : simulatePartner}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-primary-foreground"
              >
                {isPlaying ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlaying ? 'Stop Role-play' : 'Simulate Response'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <MessageSquareHeart className="w-5 h-5 text-pink-500" />
              Partner Response
            </h2>
            {partnerReply && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-gradient-to-r from-muted/50 to-muted-foreground/10 border border-border/50"
              >
                <p className="text-foreground italic">"{partnerReply}"</p>
              </motion.div>
            )}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">How to respond:</h3>
              <div className="p-3 rounded bg-card/50 border border-border/50">
                <p className="text-sm text-foreground">
                  {roleplayStyle === 'supportive' && "Acknowledge their openness and continue the dialogue with gratitude."}
                  {roleplayStyle === 'defensive' && "Stay calm, validate their perspective, and gently redirect to your feelings."}
                  {roleplayStyle === 'dismissive' && "Ask for a better time to talk and express why this matters to you."}
                  {roleplayStyle === 'curious' && "Answer their questions honestly and with vulnerability."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-border">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Couple's Mode
            </h2>
            <Button
              onClick={() => setCouplesMode(!couplesMode)}
              variant="outline"
              className="border-border text-foreground hover:bg-muted"
            >
              {couplesMode ? 'Disable' : 'Enable'}
            </Button>
          </div>
          {couplesMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-medium text-foreground">Your Partner's Perspective</h3>
                  <Input value={partnerFeeling} onChange={(e) => setPartnerFeeling(e.target.value)} placeholder="Partner feels..." className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
                  <Input value={partnerSituation} onChange={(e) => setPartnerSituation(e.target.value)} placeholder="When..." className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
                  <Input value={partnerBecause} onChange={(e) => setPartnerBecause(e.target.value)} placeholder="Because..." className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
                  <Input value={partnerRequest} onChange={(e) => setPartnerRequest(e.target.value)} placeholder="Request..." className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-medium text-foreground">Merged View</h3>
                  <div className="p-3 rounded bg-card/50 border border-border/50 h-full">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{mergedCouplesView}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}