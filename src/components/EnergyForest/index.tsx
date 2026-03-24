import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import background from '../../assets/background.png';

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
const CONFIG = {
  orbCount: 6, // 初始小球数量
  orbSpawnThreshold: 5, // 小球数量阈值
  orbSpawnInterval: 3000, // 生成间隔（毫秒）- 修改为 3 秒
  baseEnergy: 15,
  variance: 10,
  colors: ['#00ff88', '#4facfe', '#f093fb', '#fa709a'] as const,
  maxEnergy: 1000,
};

// --- 子组件：能量球 ---
const EnergyOrb: React.FC<{
  id: string;
  value: number;
  color: string;
  position: { top: number; left: number };
  onCollect: (id: string, value: number, rect: DOMRect) => void;
}> = React.memo(({ id, value, color, position, onCollect }) => {
  const [isCollected, setIsCollected] = useState(false);

  const handleInteract = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isCollected) return;

    console.log(`[Debug] Orb ${id} clicked! Value: ${value}`);

    setIsCollected(true);

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    onCollect(id, value, rect);
  };

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
        pointerEvents: 'auto',
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={isCollected ? { scale: 0, opacity: 0 } : {
        y: [0, -10, 0], // 简化动画：幅度减小，周期缩短
        scale: 1,
        opacity: 1
      }}
      transition={{
        y: {
          duration: 2, // 缩短周期
          repeat: Infinity,
          ease: "easeInOut",
          delay: Math.random() * 2 // 随机延迟，错开动画
        },
        default: { duration: 0.3 }
      }}
      onClick={handleInteract}
      onTouchStart={handleInteract}
    >
      {value}g
    </motion.div>
  );
});

// --- 子组件：飞行粒子 ---
const FlyingParticle: React.FC<{
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
        pointerEvents: 'none'
      }}
      animate={{ x: deltaX, y: deltaY, scale: 0.2, opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
      onAnimationComplete={onComplete}
    />
  );
};

// --- 子组件：飘字 ---
const FloatText: React.FC<{ x: number; y: number; text: string }> = ({ x, y, text }) => (
  <motion.div
    initial={{ opacity: 1, y: 0, x: '-50%' }}
    animate={{ opacity: 0, y: -50, x: '-50%' }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    style={{
      position: 'fixed',
      left: x, top: y,
      fontSize: '20px', fontWeight: 'bold', color: '#2ecc71',
      textShadow: '0 2px 4px rgba(0,0,0,0.2)',
      pointerEvents: 'none', zIndex: 101
    }}
  >
    {text}
  </motion.div>
);

// --- 主组件 ---
const EnergyForest: React.FC = () => {
  const [totalEnergy, setTotalEnergy] = useState<number>(0);
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatTexts, setFloatTexts] = useState<FloatText[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);

  // 生成单个小球的函数
  const generateRandomOrb = useCallback((): Orb => {
    const newOrb: Orb = {
      id: `orb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // 更唯一的ID
      value: Math.floor(CONFIG.baseEnergy + Math.random() * CONFIG.variance),
      color: CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)],
      position: {
        top: 20 + Math.random() * 50,
        left: 10 + Math.random() * 80, // X轴位置仍在此范围
      }
    };
    console.log(`[Debug] Generated new orb at: ${newOrb.position.left}%`); // 临时日志
    return newOrb;
  }, []);

  // 初始化加载状态
  useEffect(() => {
    const savedData = localStorage.getItem('energyForestState');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // 确保加载的数据符合预期类型，否则使用默认值
        setTotalEnergy(parsed.totalEnergy ?? 0);
        setOrbs(parsed.orbs ?? []);
        console.log("[Debug] Loaded state from localStorage:", parsed);
      } catch (error) {
        console.error("Failed to parse localStorage data:", error);
        // 解析失败时，使用默认初始状态
        setTotalEnergy(0);
        const initialOrbs: Orb[] = Array.from({ length: CONFIG.orbCount }).map(() => generateRandomOrb());
        setOrbs(initialOrbs);
      }
    } else {
      // 如果没有保存的数据，则初始化
      setTotalEnergy(0);
      const initialOrbs: Orb[] = Array.from({ length: CONFIG.orbCount }).map(() => generateRandomOrb());
      setOrbs(initialOrbs);
      console.log("[Debug] Initialized with default state.");
    }
  }, [generateRandomOrb]); // 依赖 generateRandomOrb

  // 保存状态到 localStorage
  useEffect(() => {
    const dataToSave = {
      totalEnergy,
      orbs,
    };
    localStorage.setItem('energyForestState', JSON.stringify(dataToSave));
    console.log("[Debug] Saved state to localStorage:", dataToSave);
  }, [totalEnergy, orbs]); // 当 totalEnergy 或 orbs 变化时触发

  // 自动生成小球的定时器
  useEffect(() => {
    if (orbs.length >= CONFIG.orbSpawnThreshold) return; // 如果小球数量达标，则不启动定时器

    const intervalId = setInterval(() => {
      console.log(`[Debug] Spawning new orb. Current count: ${orbs.length}`);
      setOrbs(prev => {
        // 检查当前数量，防止在异步过程中超过阈值
        if (prev.length >= CONFIG.orbSpawnThreshold) return prev;
        return [...prev, generateRandomOrb()];
      });
    }, CONFIG.orbSpawnInterval);

    // 清理定时器
    return () => clearInterval(intervalId);
  }, [orbs.length, generateRandomOrb]); // 依赖 orbs.length 和 generateRandomOrb

  const handleCollect = useCallback((id: string, value: number, startRect: DOMRect) => {
    if (!headerRef.current) {
      console.error("Header ref not found!");
      return;
    }

    const endRect = headerRef.current.getBoundingClientRect();
    console.log("[Debug] Start Collecting:", { id, startRect, endRect });

    // 1. 逻辑移除
    setOrbs(prev => prev.filter(o => o.id !== id));

    // 2. 创建飞行粒子
    const pId = `p-${Date.now()}`;
    setParticles(prev => [...prev, { id: pId, startRect, endRect, value }]);

    // 3. 创建飘字
    const tId = `t-${Date.now()}`;
    const centerX = startRect.left + startRect.width / 2;
    const centerY = startRect.top + startRect.height / 2;
    setFloatTexts(prev => [...prev, { id: tId, x: centerX, y: centerY, text: `+${value}g` }]);

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

  // 清理飘字
  useEffect(() => {
    if (floatTexts.length === 0) return;
    const timer = setTimeout(() => {
      setFloatTexts(prev => prev.slice(1));
    }, 800);
    return () => clearTimeout(timer);
  }, [floatTexts]);

  // 计算进度百分比
  const progressPercentage = Math.min(100, Math.max(0, (totalEnergy / CONFIG.maxEnergy) * 100));

  return (
    <div style={styles.container}>
      <div style={{ ...styles.layer, ...styles.bg, pointerEvents: 'none' }} >
        <img src={background} style={styles.bgImage}/>
      </div>
      <div style={{ ...styles.layer, ...styles.fg, pointerEvents: 'none' }} />

      <div style={styles.header} ref={headerRef}>
        <motion.div
          style={styles.progressFill}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        <div style={styles.headerContent}>
          <span style={styles.label}>当前能量</span>
          <span id="energy-num" style={styles.energyValue}>{totalEnergy} / {CONFIG.maxEnergy} g</span>
        </div>
      </div>

      <div style={styles.orbContainer}>
        <AnimatePresence>
          {orbs.map(orb => (
            <EnergyOrb
              key={orb.id}
              {...orb}
              onCollect={handleCollect}
            />
          ))}
        </AnimatePresence>
      </div>

      {particles.map(p => (
        <FlyingParticle
          key={p.id}
          startRect={p.startRect}
          endRect={p.endRect}
          value={p.value}
          onComplete={() => handleParticleComplete(p.id, p.value)}
        />
      ))}

      {floatTexts.map(t => (
        <FloatText key={t.id} x={t.x} y={t.y} text={t.text} />
      ))}
    </div>
  );
};

// --- 样式 ---
const styles = {
  container: {
    position: 'relative', width: '100vw', height: '100vh',
    overflow: 'hidden', backgroundColor: '#87CEEB',
    fontFamily: 'sans-serif', touchAction: 'manipulation',
  },
  layer: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    zIndex: 1,
  },
  bg: {
    background:background,
    backgroundSize: '100% 100%',

  },
  bgImage:{
    width: '100%',
    height: '100%',
  },
  fg: {
    height: '30%', top: 'auto', bottom: 0,
    backgroundImage: 'radial-gradient(circle at 50% 100%, #4caf50 20%, transparent 21%)',
    backgroundSize: '100% 100%',
  },
  header: {
    position: 'absolute', top: '120px', left: '20px', right: '20px',
    zIndex: 40,
    height: '60px',
    borderRadius: '30px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    background: 'rgba(200, 200, 200, 0.3)',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #00c9ff, #92fe9d)',
    borderRadius: '30px',
    position: 'absolute',
    top: 0,
    left: 0,
    minWidth: '0%',
    zIndex: 1,
  },
  headerContent: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: '24px',
    width: '100%',
  },
  label: {
    fontSize: '14px',
    color: '#fff',
    fontWeight: 'bold',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  },
  energyValue: {
    fontSize: '20px',
    color: '#fff',
    fontWeight: '800',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    transition: 'transform 0.2s',
    alignSelf: 'flex-start',
  },
  orbContainer: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    zIndex: 10,
  },
  tips: {
    position: 'absolute', bottom: '30px', width: '100%', textAlign: 'center',
    color: 'white', zIndex: 60, pointerEvents: 'none',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
  }
};

export default EnergyForest;