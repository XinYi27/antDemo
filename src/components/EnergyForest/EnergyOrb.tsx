import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// --- 子组件：能量球 ---
export const EnergyOrb: React.FC<{
  id: string;
  value: number;
  color: string;
  position: { top: number; left: number; };
  onCollect: (id: string, value: number, rect: DOMRect) => void;
}> = React.memo(({ id, value, color, position, onCollect }) => {
  const [isCollected, setIsCollected] = useState(false);

  const handleInteract = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isCollected) return;
    setIsCollected(true);
    const target = e.currentTarget as HTMLElement;
    onCollect(id, value, target.getBoundingClientRect());
  }, [id, value, isCollected, onCollect]);

  return (
    <motion.div
      style={{
        position: 'absolute',
        top: `${position.top}%`,
        left: `${position.left}%`,
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, #fff, ${color})`,
        boxShadow: `0 0 15px ${color}, inset 0 0 10px rgba(255,255,255,0.8)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        color: 'rgba(0,0,0,0.7)',
        cursor: 'pointer',
        zIndex: 50,
        touchAction: 'manipulation',
        userSelect: 'none',
        willChange: 'transform',
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={isCollected ? { scale: 0, opacity: 0 } : { y: [0, -10, 0], scale: 1, opacity: 1 }}
      transition={{
        y: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 },
        default: { duration: 0.3 }
      }}
      onClick={handleInteract}
      onTouchStart={handleInteract}
    >
      {value}g
    </motion.div>
  );
});
