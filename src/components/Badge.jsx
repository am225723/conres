import React from 'react';
import { motion } from "framer-motion";

export function Badge({ icon: Icon, name, desc }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border border-yellow-400/30"
    >
      <Icon className="w-4 h-4 text-yellow-700" />
      <div>
        <div className="text-sm font-medium text-orange-900">{name}</div>
        <div className="text-xs text-orange-800">{desc}</div>
      </div>
    </motion.div>
  );
}