import React from 'react';
import backgroundImg from '../../assets/background.png';
import { CONFIG } from '.';

// --- 样式 ---
export const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
    overflow: 'hidden',
    fontFamily: 'sans-serif',
    touchAction: 'manipulation',
    backgroundColor: '#333', //  fallback
  },
  backgroundLayer: {
    position: 'fixed', // 固定定位，不随滚动条移动（虽然这里没有滚动）
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
    backgroundImage: `url(${backgroundImg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center top', // 重点：让背景图顶部对齐，确保标题露出
    backgroundRepeat: 'no-repeat',
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.0) 40%, rgba(0,0,0,0.1) 100%)',
    pointerEvents: 'none',
  },
  // 关键：顶部留白，高度 100px
  titleSpacer: {
    height: CONFIG.titleHeight,
    flexShrink: 0,
    width: '100%',
    zIndex: 1,
  },
  header: {
    height: '60px', // 进度条本身的高度
    flexShrink: 0,
    zIndex: 10,
    margin: '0 16px', // 左右留边
    borderRadius: '30px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    background: 'rgba(255, 255, 255, 0.25)', // 半透明玻璃拟态
    backdropFilter: 'blur(10px)', // 毛玻璃效果
    border: '1px solid rgba(255,255,255,0.3)',
  },
  progressFillWrapper: {
    position: 'absolute',
    top: 0, left: 0, width: '100%', height: '100%',
    zIndex: 1,
    borderRadius: '30px',
    overflow: 'hidden',
    background: 'rgba(0,0,0,0.1)', // 进度条底色
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #00c9ff, #92fe9d)',
    borderRadius: '30px',
    minWidth: '0%',
  },
  headerContent: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: '24px',
    width: '100%',
    pointerEvents: 'none', // 让点击穿透到下层（如果需要）
  },
  label: {
    fontSize: '0.75rem',
    color: '#fff',
    fontWeight: '600',
    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
    letterSpacing: '0.5px',
  },
  energyValue: {
    fontSize: '1.25rem',
    color: '#fff',
    fontWeight: '800',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  orbContainer: {
    flex: 1, // 占据剩余所有空间
    position: 'relative',
    zIndex: 5,
    width: '100%',
    // 防止小球生成在边缘太难点
    paddingBottom: '20px',
  },
  tips: {
    position: 'absolute',
    bottom: '20px',
    width: '100%',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.9)',
    zIndex: 20,
    pointerEvents: 'none',
    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
    fontSize: '0.9rem',
    fontWeight: '500',
  }
};
