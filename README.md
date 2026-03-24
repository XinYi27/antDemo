# 能量森林 (Energy Forest) 交互组件技术文档 (v1.0)

## 1. 项目概述
**能量森林 (Energy Forest)** 是一个基于 React 18+、TypeScript 和 Framer Motion 构建的高性能交互式前端组件。该组件模拟了一个动态的能量收集场景：用户通过点击屏幕上随机生成的“能量球”来积累能量，实时数据驱动顶部进度条变化，并伴随粒子飞行动画与数值飘字特效。

本组件专为移动端优先的体验设计，具备**智能碰撞检测**、**本地状态持久化**、**自适应流式布局**及**高性能渲染优化**等核心特性，旨在提供流畅、直观且视觉精美的游戏化交互体验。

---

## 2. 核心功能模块

### 2.1 智能能量球生成系统
*   **动态生成机制**：
    *   初始化时自动生成指定数量（默认 6 个）的能量球。
    *   设有自动补充逻辑：当场上球体数量低于阈值（默认 5 个）时，每隔固定时间（3 秒）尝试生成新球。
*   **智能碰撞检测 (Collision Detection)**：
    *   **原理**：将每个能量球视为刚性圆体（半径 30px），在生成新坐标前，计算其与场上所有现有球体的欧几里得距离。
    *   **安全间距**：强制要求球心距离 $> (2 \times \text{半径} + \text{安全边距})$，确保球体互不重叠，易于点击。
    *   **自适应坐标系**：基于 `orbContainer` 的实时像素尺寸 (`clientWidth/Height`) 将百分比坐标转换为物理像素进行精确计算，完美适配各类屏幕分辨率。
    *   **熔断保护**：设置最大重试次数（50 次）。若屏幕过于拥挤导致无法找到合法位置，系统将优雅地放弃本次生成，避免死循环阻塞主线程。
*   **边界约束**：生成范围限制在容器区域的 5%~95% 之间，防止球体贴边生成导致视觉截断。

### 2.2 交互反馈系统
*   **多端触控支持**：同时支持鼠标点击 (`onClick`) 和触摸操作 (`onTouchStart`)，并阻止事件冒泡，确保在复杂布局下的响应准确性。
*   **粒子汇聚动画**：
    *   点击球体后，实例化一个粒子，从球体当前位置飞行至顶部进度条中心。
    *   利用 Framer Motion 实现平滑的位移、缩放及透明度渐变，模拟能量被吸收的过程。
*   **动态数值飘字**：
    *   在点击瞬间，于球体上方生成 `+Xg` 的浮动文本。
    *   文本执行向上漂浮并逐渐消失的动画，提供即时的视觉确认。
*   **进度条联动**：
    *   总能量值实时更新，驱动顶部进度条宽度变化。
    *   数值显示部分包含微交互：每次能量增加时，数字执行一次快速的缩放弹跳效果。

### 2.3 视觉布局与适配
*   **Flexbox 流式架构**：
    *   采用 `flex-direction: column` 构建主容器，确保布局随屏幕高度自适应。
    *   **标题露出区 (`titleSpacer`)**：专门预留 100px 高度的空白区域，利用层级控制完美展示背景图中的标题部分，不被 UI 控件遮挡。
    *   **自适应游戏区**：剩余空间由游戏容器自动填充 (`flex: 1`)，最大化可交互区域。
*   **毛玻璃拟态 (Glassmorphism)**：
    *   顶部进度条容器采用 `backdrop-filter: blur(10px)` 配合半透明背景色，既保证数据清晰可读，又透过模糊效果隐约展示背景纹理，提升视觉层次感。
*   **全局背景融合**：
    *   使用 `position: fixed` 的全局背景层承载高清图片，设置 `background-position: center top` 确保标题始终对齐顶部。

### 2.4 性能优化策略
*   **渲染性能抑制**：
    *   **`React.memo`**：对 `EnergyOrb` 子组件进行深度记忆，仅在属性变更时重渲染。
    *   **`useCallback`**：缓存所有事件回调及生成逻辑函数，防止因父组件重渲染导致子组件收到新函数引用而无效更新。
*   **I/O 防抖 (Debounce)**：
    *   自定义 `useDebounce` Hook，将 `localStorage` 的写入操作延迟 1 秒执行。有效合并高频点击产生的多次写入请求，避免阻塞主线程。
*   **GPU 硬件加速**：
    *   在动画关键元素上显式声明 `will-change: transform, opacity`，提示浏览器提前创建合成层，确保动画在低性能设备上也能保持 60fps。
*   **资源管理**：
    *   粒子与飘字元素在动画结束后自动从 DOM 中移除，防止内存泄漏。

---

## 3. 技术架构详解

### 3.1 组件层级结构
```text
EnergyForest (Root Component)
├── BackgroundLayer (Fixed, Z-0)
│   ├── Background Image (Cover, Center-Top)
│   └── Gradient Overlay (Visual Enhancement)
├── TitleSpacer (Static Block, 100px) -> [Feature] Exposes BG Title
├── Header (Flex Item, Glassmorphism)
│   ├── Progress Bar (Animated Width)
│   └── Energy Counter (Scaled Text)
├── OrbContainer (Flex: 1, Relative, Ref) -> [Core] Game Area & Collision Context
│   └── EnergyOrb (Memoized List)
│       ├── Visual Sphere
│       └── Interaction Handlers
├── ParticleLayer (Fixed/Portal) -> Flying Animations
├── FloatTextLayer (Fixed/Portal) -> Pop-up Texts
└── Tips (Absolute Bottom) -> User Guide
```

### 3.2 状态管理模型
*   **核心状态 (`useState`)**：
    *   `totalEnergy`: 当前累计能量值。
    *   `orbs`: 场上所有能量球的数组（包含 ID、数值、颜色、坐标）。
    *   `particles`: 正在飞行的粒子队列。
    *   `floatTexts`: 正在显示的飘字队列。
*   **持久化存储 (`localStorage`)**：
    *   **读取策略**：组件挂载时尝试解析本地数据，若数据损坏或缺失则回退至默认初始状态。
    *   **写入策略**：监听经防抖处理后的状态变化，自动序列化保存 `totalEnergy` 和 `orbs` 布局，确保刷新页面后进度与场景保留。
*   **引用管理 (`useRef`)**：
    *   `headerRef`: 获取进度条 DOM 节点，用于计算粒子飞行的终点坐标。
    *   `orbContainerRef`: 获取游戏容器 DOM 节点，用于获取实时宽高以执行碰撞检测。

### 3.3 关键配置参数 (`CONFIG`)
| 参数名 | 默认值 | 类型 | 说明 |
| :--- | :--- | :--- | :--- |
| `orbCount` | 6 | Number | 初始生成的球体数量 |
| `orbSpawnThreshold` | 5 | Number | 触发自动补球的最小在场数量 |
| `orbSpawnInterval` | 3000 | ms | 自动补球的时间间隔 |
| `orbRadius` | 30 | px | 球体半径（用于碰撞计算） |
| `orbSafePadding` | 15 | px | 球体间的最小安全间距 |
| `maxSpawnAttempts` | 50 | Number | 碰撞检测最大重试次数（熔断阈值） |
| `titleHeight` | 100 | px | 顶部预留背景标题的高度 |
| `debounceDelay` | 1000 | ms | 本地存储写入的防抖延迟 |
| `maxEnergy` | 1000 | Number | 能量上限阈值 |

---

## 4. 关键技术难点与解决方案

| 挑战 | 根本原因分析 | 解决方案 (v1.0) |
| :--- | :--- | :--- |
| **球体重叠导致无法点击** | 纯随机算法未考虑实体体积，高概率生成重合坐标。 | **引入圆形碰撞检测算法**：基于像素距离遍历校验，结合重试机制与安全边距，确保物理隔离。 |
| **密集生成导致主线程卡顿** | 屏幕过满时，随机算法陷入无限循环寻找空位。 | **熔断保护机制**：限制最大尝试次数 (50 次)，失败则跳过本次生成，保障帧率稳定。 |
| **高频点击引发 I/O 阻塞** | 每次点击立即写入 `localStorage`，磁盘操作频繁。 | **时间片防抖**：使用 `useDebounce` 将写入操作合并延迟执行，大幅降低 I/O 频率。 |
| **背景标题被 UI 遮挡** | 传统绝对定位布局缺乏弹性，容易覆盖背景关键区域。 | **Flex 流式留白**：插入固定高度的占位符 (`titleSpacer`)，利用文档流自然腾出空间。 |
| **动画掉帧** | 大量 DOM 节点同时运动触发重排 (Reflow)。 | **合成层优化**：使用 `will-change` 提示 GPU 加速，并将动画限制在 `transform` 和 `opacity` 属性上。 |
| **小屏幕布局错乱** | 硬编码像素值导致在不同设备上的比例失调。 | **相对单位体系**：全面采用 `%`, `rem`, `vh` 及 Flex 弹性布局，实现全分辨率适配。 |

---

## 5. 依赖与环境
*   **核心框架**: React 18+
*   **开发语言**: TypeScript
*   **动画库**: Framer Motion
*   **样式方案**: CSS-in-JS (Inline Styles with React.CSSProperties)
*   **构建工具**: Vite / Webpack (需配置图片资源加载)

## 6. 未来演进路线
1.  **物理引擎集成**：引入 Matter.js 实现球体间的真实碰撞反弹效果。
2.  **音效系统**：基于 Web Audio API 添加收集、生成及升级音效。
3.  **难度动态曲线**：随能量值增加，动态调整生成速度与球体移动速度。
4.  **PWA 支持**：配置 Service Worker 实现离线可用及桌面端安装。
