# src/context — 状态管理与上下文模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/screens/`](../screens/README.md) 及 [`src/components/`](../components/README.md)（深度依赖本模块提供的 Context 进行视图绑定与渲染）

## 简介

本模块为基于 React 与 Ink 的终端 UI 应用提供全局状态管理的底层支持。基于 React Context 模式，模块构建了多维度的上下文数据抽象池，负责模态框（Modal）调度、全屏覆盖层栈维护、应用渲染帧率指标监控，以及统一的消息队列收发。该架构有效化解了多层级嵌套组件间属性传递（Prop Drilling）引发的代码耦合问题。

## 目录结构

```text
context/
├── __test__/                        # Context 隔离状态管理与消费逻辑的自动化测试
├── QueuedMessageContext.tsx         # 序列化队列消息处理的上下文定义
├── fpsMetrics.tsx                   # 终端渲染性能监控（帧率遥测）上下文
├── mailbox.tsx                      # 事件总线信箱上下文，用于解耦组件或进程间的异步通信
├── modalContext.tsx                 # 模态框渲染堆栈与交互调度上下文
├── notifications.tsx                # 全局通知横幅与瞬态弹窗的显示上下文
├── overlayContext.tsx               # 覆盖层管理（负责 UI 层叠堆叠的深度控制 z-index）
├── promptOverlayContext.tsx         # 用户输入提示与交互专用覆盖层状态
├── stats.tsx                        # 会话生命周期与系统资源统计数据上下文
└── voice.tsx                        # 语音模式硬件连接状态及交互激活上下文
```

## 实现逻辑分析

### 1. 终端渲染的响应式防抖与内存引用优化
与基于浏览器 DOM 的 React 环境相比，向终端（TTY）输出控制台转义字符的重绘开销尤为高昂。为避免顶层 Context 状态的非本质性变动触发全局树的冗余重绘（Redundant Re-render），引发性能降级或视觉伪影，部分高频更新的 Context（如 `QueuedMessageContext`）引入了基于 `react/compiler-runtime` 的编译时优化或极深度的 `useMemo` 细粒度缓存池。通过严格约束向下传递的 Context Value 的内存引用一致性，有效隔离了高频状态突变引发的级联更新风暴（Cascading Update Storms）。

### 2. 帧率反馈控制 (FPS Metrics) 与流式限流
`fpsMetrics.tsx` 提供了一个实时监测终端重绘周期的帧率计算模块。该性能指标深度参与系统的渲染控制环路：在模型下行流式文本（Streaming Text）的高载阶段，若系统监测到帧率降至健康阈值之下，渲染管线可依据此 Context 输出的反馈信号，自适应调节节流（Throttling）参数，或对中间态字符实施丢帧降级策略，优先保障主界面的响应能力与 TTY 进程的稳定性。

### 3. 解耦的异步通信总线 (Mailbox & Queued Messages)
`mailbox.tsx` 与 `QueuedMessageContext.tsx` 协同构建了基于事件驱动的进程内通信总线。该设计允许底层组件跨越层级边界向外发射全局广播信号（如弹出错误警告、触发重试流程等）。信号体将进入先进先出序列化队列缓冲，并在下一个 UI 渲染滴答（Tick）内被集中弹出并转换为可视化通知。此队列机制实现了多并发事件状态的安全聚合，规避了直接篡改 UI 结构可能诱发的状态冲突。

## 维护规范

### 新增规则
- 当应用需引入跨越现有视图栈的新全局展示层（例如新增全局调试信息面板），或新增系统级共享数据源时，可在本模块增设对应的 Context 实体。
- 新增 Context 必须通过自定义的 `useXXX` 钩子（Hook）暴露读取接口，严禁在外部直接引入原始 Context 对象；并须在应用拓扑的最外层组件树中进行显式包裹挂载。

### 重构规则
- 若需修改 Provider 下发 `value` 的对象结构构建逻辑，属高危操作。必须通过性能分析工具验证对象引用一致性，严禁因未命中缓存导致下游依赖组件的大面积非预期重绘。

### 废弃规则
- 清理废弃的 Context 实体时，需完整切断两个维度的引用链：一是确保其挂载在主应用容器中的 Provider 已被移除；二是执行全量代码检索，确保所有消费侧（Consumer）的 UI 子树已安全卸载相关逻辑。
