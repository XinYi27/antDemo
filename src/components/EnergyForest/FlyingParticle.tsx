import React from 'react';
import { motion } from 'framer-motion';

// --- 子组件：飞行粒子 ---
export const FlyingParticle: React.FC<{
  startRect: DOMRect;
  endRect: DOMRect;
  value: number;
  onComplete: () => void;
}> = ({ startRect, endRect, value, onComplete }) => {
  const deltaX = (endRect.left + endRect.width / 2) - (startRect.left + startRect.width / 2);
  const deltaY = (endRect.top + endRect.height / 2) - (startRect.top + startRect.height / 2);

  return (
    <motion.div
      initial={{
        x: 0, y: 0, scale: 1, opacity: 1,
        position: 'fixed',
        left: startRect.left, top: startRect.top,
        width: startRect.width, height: startRect.height,
        zIndex: 100,
        background: `radial-gradient(circle at 30% 30%, #fff, #00ff88)`,
        borderRadius: '50%',
        pointerEvents: 'none',
        willChange: 'transform, opacity',
      }}
      animate={{ x: deltaX, y: deltaY, scale: 0.2, opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
      onAnimationComplete={onComplete} />
  );
};
