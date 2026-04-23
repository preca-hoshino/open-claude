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

## 实现逻辑

### 跨组件响应式状态抽象
与传统的 Redux 相比，基于 Ink 构建的终端应用更加扁平且对单一流的更新更敏感。这里将各个独立领域（如：模态框、通知框、输入遮罩）划分为极高内聚度的 Context Provider。这避免了因为“组件树过深”而导致的 Prop Drilling（属性透传）。

### 帧率控制与复杂消息流
部分 Context 承担了极重的业务负载。例如 `fpsMetrics.tsx` 可以用来避免终端在高频输出（如大语言模型流式返回文字）时的撕裂或卡顿问题；`QueuedMessageContext.tsx` 及 `mailbox.tsx` 则确保了在高并发状态下，外部事件注入 UI 时的防抖动和消息排队。

## 新增 / 重构 / 删除向导

### 新增
- 当出现一种需要在全局任意视图弹出的新 UI 层（例如全局按键提示栏）或新的全域数据源时，可在本目录新增 Context。
- 任何新增的 Context 必须附带一个自定义的 `useXXX` Hook 暴露出去，禁止直接导出原始 Context 对象，并在顶层的 `src/entrypoints/` 渲染树中挂载。

### 重构
- 对 `notifications.tsx` 或 `modalContext.tsx` 等高频渲染源的重构必须考虑性能优化（如恰当地使用 `useMemo` 或 `useReducer`），避免引发整个根应用树的不必要重渲染。

### 删除
- 删除某个过时的 Context 时，需要彻底排查其配套的 Provider 是否从主应用的启动包裹器中卸载，且所有下层消费该 Context 的 UI 组件已被安全移除。
