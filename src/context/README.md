# src/context — 状态管理与上下文模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/screens/`](../screens/README.md) 及 [`src/components/`](../components/README.md)（大量依赖本目录提供的 Context 进行渲染）

## 简介

本模块构成了终端 UI 应用（基于 React / Ink）的全局状态管理核心。它使用 React Context 范式，为整个应用树提供了包括模态框调度、全屏覆盖层、应用性能指标监控、统一消息收发队列等各种横跨多层组件的上下文数据抽象。

## 目录结构

```text
context/
├── __test__/                        # Context 数据逻辑的隔离测试
├── QueuedMessageContext.tsx         # 序列化队列消息处理的上下文
├── fpsMetrics.tsx                   # 终端渲染性能（帧率）监控上下文
├── mailbox.tsx                      # 信箱上下文，用于松耦合的进程或组件间通信
├── modalContext.tsx                 # 模态框（Modal）渲染及调度上下文
├── notifications.tsx                # 全局通知横幅与弹窗上下文
├── overlayContext.tsx               # 覆盖层管理（处理界面的层叠堆叠 z-index）
├── promptOverlayContext.tsx         # 用户输入提示与交互专用覆盖层
├── stats.tsx                        # 会话、系统状态等统计数据上下文
└── voice.tsx                        # 语音模式激活与相关硬件连接状态上下文
```

## 实现逻辑细节

### 1. 终端 React 的响应式防抖与性能调优
与基于浏览器的 React DOM 相比，基于 Ink 渲染到终端（TTY）的开销和瓶颈不同（尤其是处理大量控制台转义字符时）。为了防止顶层 Context 状态刷新引发整个应用树的无意义重绘导致闪烁，部分 Context（如 `QueuedMessageContext`）甚至引入了 `react/compiler-runtime` 或深度的 `useMemo` 细粒度缓存。这意味着传递给子组件的上下文 Value 被严格约束了引用一致性，确保高频事件不会引起雪崩式渲染。

### 2. 帧率控制 (FPS Metrics) 与流式限流
在 `fpsMetrics.tsx` 中，系统实时计算终端重绘的帧率。这一底层数据不单为了展示，更是深度整合到渲染循环中：当模型开始高速输出流式文本（Streaming Text）时，若检测到 FPS 暴跌引发卡顿风险，上游可能会基于此 Context 动态增加节流（Throttling）或丢弃部分中间态字符，优先保证最终画面的完整性与终端的存活。

### 3. 松耦合的通信总线 (Mailbox & Queued Messages)
`mailbox.tsx` 与 `QueuedMessageContext.tsx` 协同实现了一套事件通信总线。为了避免深度嵌套组件（Prop Drilling），它们允许任意位置的底层组件向外广播消息（如弹出警告、触发重试等）。这些消息会被序列化进入列队管理，并在下一个 UI 刷新周期被统一取出渲染为可视化的通知框，防止了多源事件同时篡改 UI 结构造成的冲突。

## 新增 / 重构 / 删除向导

### 新增
- 当出现一种需要在全局任意视图弹出的新 UI 层（例如全局按键提示栏）或新的全域数据源时，可在本目录新增 Context。
- 任何新增的 Context 必须附带一个自定义的 `useXXX` Hook 暴露出去，禁止直接导出原始 Context 对象。并在顶层的 `src/entrypoints/` 渲染树中进行挂载包装。

### 重构
- 任何引起 Provider 中 `value` 对象引用变动的重构都属于高危操作！请务必通过 React DevTools（或审查编译产物）确认没有导致不必要的组件大面积重算。

### 删除
- 删除某个过时的 Context 时，需要彻底排查其配套的 Provider 是否已从主应用的启动包裹器中卸除，并且所有消费该 Context 的 UI 子节点已经安全移除对它的引用。
