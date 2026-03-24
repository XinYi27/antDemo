import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

// --- 配置常量 ---
const CONFIG = {
  orbCount: 8,
  baseEnergy: 15,
  variance: 10,
  colors: [
    '#00ff88', // 绿色
    '#4facfe', // 蓝色
    '#f093fb', // 粉色
    '#fa709a', // 红色
  ]
};

// --- 子组件：单个能量球 ---
// 使用 React.memo 优化，防止父组件更新时不必要的重渲染
const EnergyOrb = React.memo(({ id, value, color, onCollect, position }) => {
  const controls = useAnimation();
  const [isCollected, setIsCollected] = useState(false);

  // 漂浮动画配置
  const floatVariants = {
    idle: {
      y: [0, -15, 0],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
        delay: Math.random() * 2, // 随机延迟，让每个球不同步
      }
    },
    collected: {
      scale: 0,
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const handleClick = async (e) => {
    if (isCollected) return;
    
    // 阻止事件冒泡（如果需要）
    e.stopPropagation();
    
    setIsCollected(true);
    
    // 获取点击位置和目标位置（用于计算飞行轨迹）
    // 注意：在 framer-motion 中，更优雅的方式是使用 layoutId 共享元素动画，
    // 但为了精确控制飞向特定的 Header 元素，我们这里采用手动触发回调 + 视觉反馈
    
    // 通知父组件开始收集流程，传递当前元素的 DOM 信息
    const rect = e.currentTarget.getBoundingClientRect();
    onCollect(id, value, rect);
  };

  return (
    <motion.div
      className="energy-orb"
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
        fontSize: '12px',
        fontWeight: 'bold',
        color: 'rgba(0,0,0,0.6)',
        cursor: 'pointer',
        willChange: 'transform, opacity', // 性能提示
        zIndex: 10,
        touchAction: 'manipulation'
      }}
      variants={floatVariants}
      animate={isCollected ? "collected" : "idle"}
      onClick={handleClick}
      // 移动端触摸优化
      whileTap={{ scale: 0.9 }}
    >
      {value}
      {/* 
         【AI 加分项集成点】
         如果你有 AI 生成的图片，可以这样替换背景：
         <img src={`/assets/orb-${id}.png`} style={{width: '100%', height: '100%', objectFit: 'contain'}} alt="orb" />
      */}
    </motion.div>
  );
});

// --- 子组件：飞行的能量粒子 (视觉反馈) ---
const FlyingParticle = ({ startRect, endRect, value, onComplete }) => {
  // 计算相对位移
  const deltaX = endRect.left + endRect.width / 2 - (startRect.left + startRect.width / 2);
  const deltaY = endRect.top + endRect.height / 2 - (startRect.top + startRect.height / 2);

  return (
    <motion.div
      initial={{ 
        x: 0, 
        y: 0, 
        scale: 1, 
        opacity: 1,
        position: 'fixed',
        left: startRect.left,
        top: startRect.top,
        width: startRect.width,
        height: startRect.height,
        zIndex: 100
      }}
      animate={{ 
        x: deltaX, 
        y: deltaY, 
        scale: 0.2, 
        opacity: 0 
      }}
      transition={{ 
        duration: 0.6, 
        ease: [0.25, 1, 0.5, 1] // 快速飞出，慢速吸入
      }}
      onAnimationComplete={onComplete}
      style={{
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, #fff, #00ff88)`,
        pointerEvents: 'none', // 忽略点击
        willChange: 'transform, opacity'
      }}
    />
  );
};

// --- 子组件：飘字效果 (+15g) ---
const FloatText = ({ x, y, text }) => {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, x: '-50%' }}
      animate={{ opacity: 0, y: -40, x: '-50%' }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      onAnimationComplete={() => {}} // 父组件负责清理
      style={{
        position: 'fixed',
        left: x,
        top: y,
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#2ecc71',
        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
        pointerEvents: 'none',
        zIndex: 101
      }}
    >
      {text}
    </motion.div>
  );
};

// --- 样式对象 (模拟 CSS Modules) ---
const styles = {
  container: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#87CEEB',
    touchAction: 'manipulation',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  },
  bg: {
    position: 'absolute',
    top: 0, left: 0, width: '100%', height: '100%',
    background: 'linear-gradient(180deg, #a8edea 0%, #fed6e3 100%)',
    zIndex: 1,
  },
  fg: {
    position: 'absolute',
    bottom: 0, left: 0, width: '100%', height: '30%',
    backgroundImage: 'radial-gradient(circle at 50% 100%, #4caf50 20%, transparent 21%)',
    backgroundSize: '100% 100%',
    zIndex: 2,
    pointerEvents: 'none',
  },
  header: {
    position: 'absolute',
    top: '20px', left: '20px', right: '20px',
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(10px)',
    padding: '12px 24px',
    borderRadius: '30px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  },
  label: {
    fontSize: '14px',
    color: '#555',
    fontWeight: 'bold',
  },
  energyBox: {
    // 用于获取坐标的参考点
  },
  energyValue: {
    fontSize: '24px',
    color: '#2ecc71',
    fontWeight: '800',
    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    display: 'inline-block',
  },
  orbContainer: {
    position: 'absolute',
    top: 0, left: 0, width: '100%', height: '100%',
    zIndex: 10,
    pointerEvents: 'none', // 让点击穿透到具体的 orb
  },
  tips: {
    position: 'absolute',
    bottom: '30px',
    width: '100%',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.9)',
    fontSize: '14px',
    zIndex: 20,
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  }
};

// --- 主组件 ---
const EnergyForest = () => {
  const [totalEnergy, setTotalEnergy] = useState(1250);
  const [orbs, setOrbs] = useState([]);
  const [particles, setParticles] = useState([]); // 存储正在飞行的粒子
  const [floatTexts, setFloatTexts] = useState([]); // 存储飘字
  const headerRef = React.useRef(null);

  // 初始化能量球
  useEffect(() => {
    const newOrbs = Array.from({ length: CONFIG.orbCount }).map((_, i) => ({
      id: `orb-${i}-${Date.now()}`,
      value: Math.floor(CONFIG.baseEnergy + Math.random() * CONFIG.variance),
      color: CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)],
      position: {
        top: 15 + Math.random() * 55, // 15% - 70%
        left: 10 + Math.random() * 75, // 10% - 85%
      }
    }));
    setOrbs(newOrbs);
  }, []);

  // 处理收集逻辑
  const handleCollect = useCallback((id, value, startRect) => {
    if (!headerRef.current) return;

    const endRect = headerRef.current.getBoundingClientRect();

    // 1. 从列表中移除该球 (逻辑删除)
    setOrbs(prev => prev.filter(o => o.id !== id));

    // 2. 添加飞行粒子 (视觉层)
    const particleId = `particle-${Date.now()}`;
    setParticles(prev => [...prev, { id: particleId, startRect, endRect, value }]);

    // 3. 添加飘字
    const textId = `text-${Date.now()}`;
    const centerX = startRect.left + startRect.width / 2;
    const centerY = startRect.top + startRect.height / 2;
    setFloatTexts(prev => [...prev, { id: textId, x: centerX, y: centerY, text: `+${value}g` }]);

  }, []);

  // 粒子动画结束回调
  const handleParticleComplete = useCallback((particleId, value) => {
    // 移除粒子
    setParticles(prev => prev.filter(p => p.id !== particleId));
    
    // 更新总分 (带动画效果)
    setTotalEnergy(prev => {
      const newVal = prev + value;
      // 触发数字跳动 (通过关键帧或简单的状态副作用，这里简化处理，实际可加 CSS 类)
      const displayEl = document.getElementById('energy-display');
      if (displayEl) {
        displayEl.style.transform = 'scale(1.4)';
        setTimeout(() => displayEl.style.transform = 'scale(1)', 200);
      }
      return newVal;
    });
  }, []);

  // 飘字动画结束回调 (简单延时清理，实际应由 onAnimationComplete 触发，这里为了演示简化)
  useEffect(() => {
    if (floatTexts.length === 0) return;
    const timer = setTimeout(() => {
      setFloatTexts(prev => prev.slice(1)); // 移除最早的
    }, 800);
    return () => clearTimeout(timer);
  }, [floatTexts]);

  return (
    <div style={styles.container}>
      {/* 背景层 */}
      <div style={styles.bg}>
        {/* 【AI 加分项】在此处替换为 AI 生成的背景图 */}
        {/* <img src="/ai-bg.jpg" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> */}
      </div>
      
      {/* 前景装饰 */}
      <div style={styles.fg}></div>

      {/* 头部能量计 */}
      <div style={styles.header}>
        <span style={styles.label}>当前能量</span>
        <div ref={headerRef} style={styles.energyBox}>
          <span id="energy-display" style={styles.energyValue}>{totalEnergy} g</span>
        </div>
      </div>

      {/* 能量球列表 */}
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

      {/* 飞行粒子层 (Portal 或直接渲染在顶层) */}
      {particles.map(p => (
        <FlyingParticle
          key={p.id}
          {...p}
          onComplete={() => handleParticleComplete(p.id, p.value)}
        />
      ))}

      {/* 飘字层 */}
      {floatTexts.map(t => (
        <FloatText key={t.id} {...t} />
      ))}

      <div style={styles.tips}>点击能量球收集绿色能量</div>
    </div>
  );
};



export default EnergyForest;