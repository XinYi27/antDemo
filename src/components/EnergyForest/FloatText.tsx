import React from 'react';
import { motion } from 'framer-motion';

// --- 子组件：飘字 ---
export const FloatText: React.FC<{ x: number; y: number; text: string; }> = ({ x, y, text }) => (
  <motion.div
    initial={{ opacity: 1, y: 0, x: '-50%' }}
    animate={{ opacity: 0, y: -50, x: '-50%' }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    style={{
      position: 'fixed',
      left: x, top: y,
      fontSize: '20px', fontWeight: 'bold', color: '#2ecc71',
      textShadow: '0 2px 4px rgba(0,0,0,0.2)',
      pointerEvents: 'none', zIndex: 101,
      willChange: 'transform, opacity',
    }}
  >
    {text}
  </motion.div>
);
