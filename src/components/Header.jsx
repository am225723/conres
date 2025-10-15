import React from 'react';
import { motion } from "framer-motion";
import { MessageSquare as MessageSquareHeart, Heart } from 'lucide-react';
import { Badge } from '@/components/Badge';

export function Header({ logoSrc, badges }) {
  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3">
          {logoSrc && (
            <img className="w-16 h-16" alt="Unleash Your Hue Logo" src={logoSrc} />
          )}
          <h1 className="text-4xl font-bold gradient-text">I-Statement Builder</h1>
          <Heart className="w-8 h-8 text-rose-500 floating-animation" />
        </div>
        <p className="text-lg text-foreground max-w-2xl mx-auto">
          Transform your communication with empathy, clarity, and emotional intelligence
        </p>
      </motion.div>

      {badges.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-wrap gap-2 justify-center"
        >
          {badges.map((badge, idx) => (
            <Badge key={idx} {...badge} />
          ))}
        </motion.div>
      )}
    </>
  );
}