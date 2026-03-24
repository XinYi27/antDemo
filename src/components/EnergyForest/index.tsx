import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// 确保你的构建工具支持图片导入 (如 Vite, Webpack)
import { EnergyOrb } from './EnergyOrb';
import { FlyingParticle } from './FlyingParticle';
import { FloatText } from './FloatText';
import { useDebounce } from './useDebounce';
import { styles } from './styles';

// --- 类型定义 ---
interface Orb {
  id: string;
  value: number;
  color: string;
  position: { top: number; left: number };
}

interface Particle {
  id: string;
  startRect: DOMRect;
  endRect: DOMRect;
  value: number;
}

interface FloatText {
  id: string;
  x: number;
  y: number;
  text: string;
}

// --- 配置 ---
export const CONFIG = {
  orbCount: 6,
  orbSpawnThreshold: 5,
  orbSpawnInterval: 3000,
  baseEnergy: 15,
  variance: 10,
  colors: ['#00ff88', '#4facfe', '#f093fb', '#fa709a'] as const,
  maxEnergy: 1000,
  debounceDelay: 1000,
  titleHeight: '100px', // 顶部预留高度
};

// --- 主组件 ---
const EnergyForest: React.FC = () => {
  const [totalEnergy, setTotalEnergy] = useState<number>(0);
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatTexts, setFloatTexts] = useState<FloatText[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);

  const generateRandomOrb = useCallback((): Orb => {
    return {
      id: `orb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      value: Math.floor(CONFIG.baseEnergy + Math.random() * CONFIG.variance),
      color: CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)],
      position: {
        top: 15 + Math.random() * 60, // 调整生成范围，避免太靠上被标题挡住或太靠下
        left: 10 + Math.random() * 80,
      }
    };
  }, []);

  // 初始化
  useEffect(() => {
    const savedData = localStorage.getItem('energyForestState');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setTotalEnergy(parsed.totalEnergy ?? 0);
        setOrbs(parsed.orbs ?? []);
      } catch (e) {
        console.error("Load error", e);
        initDefault();
      }
    } else {
      initDefault();
    }
  }, [generateRandomOrb]);

  const initDefault = () => {
    setTotalEnergy(0);
    setOrbs(Array.from({ length: CONFIG.orbCount }).map(() => generateRandomOrb()));
  };

  // 防抖保存
  const debouncedTotalEnergy = useDebounce(totalEnergy, CONFIG.debounceDelay);
  const debouncedOrbs = useDebounce(orbs, CONFIG.debounceDelay);

  useEffect(() => {
    localStorage.setItem('energyForestState', JSON.stringify({
      totalEnergy: debouncedTotalEnergy,
      orbs: debouncedOrbs,
    }));
  }, [debouncedTotalEnergy, debouncedOrbs]);

  // 自动生成
  useEffect(() => {
    if (orbs.length >= CONFIG.orbSpawnThreshold) return;
    const intervalId = setInterval(() => {
      setOrbs(prev => {
        if (prev.length >= CONFIG.orbSpawnThreshold) return prev;
        return [...prev, generateRandomOrb()];
      });
    }, CONFIG.orbSpawnInterval);
    return () => clearInterval(intervalId);
  }, [orbs.length, generateRandomOrb]);

  const handleCollect = useCallback((id: string, value: number, startRect: DOMRect) => {
    if (!headerRef.current) return;
    const endRect = headerRef.current.getBoundingClientRect();

    setOrbs(prev => prev.filter(o => o.id !== id));

    const pId = `p-${Date.now()}`;
    setParticles(prev => [...prev, { id: pId, startRect, endRect, value }]);

    const tId = `t-${Date.now()}`;
    setFloatTexts(prev => [...prev, {
      id: tId,
      x: startRect.left + startRect.width / 2,
      y: startRect.top + startRect.height / 2,
      text: `+${value}g`
    }]);
  }, []);

  const handleParticleComplete = useCallback((pid: string, value: number) => {
    setParticles(prev => prev.filter(p => p.id !== pid));
    setTotalEnergy(prev => {
      const next = Math.min(CONFIG.maxEnergy, prev + value);
      const el = document.getElementById('energy-num');
      if (el) {
        el.style.transform = 'scale(1.5)';
        setTimeout(() => el.style.transform = 'scale(1)', 200);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (floatTexts.length === 0) return;
    const timer = setTimeout(() => setFloatTexts(prev => prev.slice(1)), 800);
    return () => clearTimeout(timer);
  }, [floatTexts]);

  const progressPercentage = Math.min(100, Math.max(0, (totalEnergy / CONFIG.maxEnergy) * 100));

  return (
    <div style={styles.container}>
      {/* 1. 全局背景层 (固定定位，覆盖全屏) */}
      <div style={styles.backgroundLayer}>
        {/* 可选：叠加一层淡淡的遮罩，让文字更清晰，但不完全遮挡背景标题 */}
        <div style={styles.overlay} />
      </div>

      {/* 2. 内容流 (Flex Column) */}

      {/* 顶部留白区域 (露出背景标题) */}
      <div style={{
        height: CONFIG.titleHeight,
        ...styles.titleSpacer,
      }} />

      {/* 进度条区域 (在留白下方) */}
      <div style={styles.header} ref={headerRef}>
        <div style={styles.progressFillWrapper}>
          <motion.div
            style={styles.progressFill}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div style={styles.headerContent}>
          <span style={styles.label}>当前能量</span>
          <span id="energy-num" style={styles.energyValue}>{totalEnergy} / {CONFIG.maxEnergy} g</span>
        </div>
      </div>

      {/* 游戏主区域 */}
      <div style={styles.orbContainer}>
        <AnimatePresence>
          {orbs.map(orb => (
            <EnergyOrb key={orb.id} {...orb} onCollect={handleCollect} />
          ))}
        </AnimatePresence>
      </div>

      {/* 底部提示 */}
      <div style={styles.tips}>点击能量球 (当前 {orbs.length} 个)</div>

      {/* 粒子和飘字 (Portal 或 Fixed 定位) */}
      {particles.map(p => (
        <FlyingParticle key={p.id} {...p} onComplete={() => handleParticleComplete(p.id, p.value)} />
      ))}
      {floatTexts.map(t => (
        <FloatText key={t.id} x={t.x} y={t.y} text={t.text} />
      ))}
    </div>
  );
};

export default EnergyForest;