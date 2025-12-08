import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Sun, Star, Cloud } from 'lucide-react';

const HealingAnimation = ({ isActive, emotion, onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [healingMessage, setHealingMessage] = useState('');

  const healingMessages = {
    0: "Acknowledging your feelings...",
    1: "Releasing tension...",
    2: "Finding inner peace...",
    3: "Embracing healing energy...",
    4: "You are worthy of love and peace."
  };

  const emotionColors = {
    hurt: ['#FF6B6B', '#FEC89A'],
    angry: ['#FF0000', '#FFB4A2'],
    sad: ['#6B8E9F', '#B8E0D2'],
    anxious: ['#FFA500', '#FFE5B4'],
    frustrated: ['#FF7F50', '#FFDAB9'],
    scared: ['#9370DB', '#E6E6FA'],
    default: ['#AEC6CF', '#E8F5E9']
  };

  const colors = emotionColors[emotion?.toLowerCase()] || emotionColors.default;

  useEffect(() => {
    if (!isActive) {
      setPhase(0);
      return;
    }

    const interval = setInterval(() => {
      setPhase(prev => {
        if (prev >= 4) {
          clearInterval(interval);
          setTimeout(() => onComplete?.(), 1500);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive, onComplete]);

  useEffect(() => {
    setHealingMessage(healingMessages[phase]);
  }, [phase]);

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <motion.div
        className="relative w-80 h-80 flex items-center justify-center"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
      >
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
            }}
            initial={{ 
              x: 0, 
              y: 0, 
              opacity: 0,
              scale: 0
            }}
            animate={{ 
              x: Math.cos((i * 30) * Math.PI / 180) * (50 + phase * 20),
              y: Math.sin((i * 30) * Math.PI / 180) * (50 + phase * 20),
              opacity: [0, 1, 0.8, 1],
              scale: [0, 1, 1.2, 1],
              rotate: [0, 360]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        ))}

        <motion.div
          className="absolute"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Heart 
            className="w-24 h-24" 
            style={{ 
              color: colors[0],
              filter: `drop-shadow(0 0 20px ${colors[0]})`
            }} 
            fill={colors[1]}
          />
        </motion.div>

        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: [0, (Math.random() - 0.5) * 200],
              y: [0, (Math.random() - 0.5) * 200],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </motion.div>
        ))}

        <motion.div
          className="absolute bottom-[-80px] text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={phase}
        >
          <p className="text-lg font-medium text-white drop-shadow-lg">
            {healingMessage}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className={`w-2 h-2 rounded-full ${i <= phase ? 'bg-white' : 'bg-white/30'}`}
                animate={i === phase ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default HealingAnimation;
