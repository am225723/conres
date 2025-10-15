import React from 'react';
import { motion } from "framer-motion";

export function Pill({ label, selected, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`px-3 py-1 rounded-full border text-sm transition-all duration-200 ${
        selected
          ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground border-transparent shadow-lg"
          : "bg-background/80 text-foreground border-border hover:border-primary/50 hover:bg-muted"
      }`}
    >
      {label}
    </motion.button>
  );
}