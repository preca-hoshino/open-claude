# 全局应用状态管理模块 (`state`)

本模块提供了一个响应式、类型安全的全局状态管理层，支撑 Open-Claude 及其关联界面中的高频、复杂状态流转。该模块结合了原生的订阅发布模式与 React 的并发特性，确保渲染性能与架构解耦。

## 核心实现逻辑

### 1. 轻量级状态容器 (`store.ts` & `AppStateStore.ts`)
弃用重量级的外部状态库（如 Redux），本模块通过闭包实现了一个微型且高效的 Vanilla JS Store (`store.ts`)。
- **不可变更新与全量状态树**：`AppStateStore.ts` 中定义了极度详尽的 `AppState`，涵盖了会话桥接 (`replBridge`)、多模态开关、代理编排记录 (`tasks`)、MCP 插件池、权限模式等。要求每次 `setState` 遵循完全的不可变更新（Immutable Updates）原则。
- **工厂化自举**：提供 `getDefaultAppState` 进行默认值初始化，特别针对不同环境（如 Teammate 是否需要 Plan 模式）做了惰性推断。

### 2. React 绑定与切片订阅 (`AppState.tsx`)
将底层原生 Store 安全地暴露给 React 组件树。
- **`useSyncExternalStore` 驱动**：使用 `useAppState` 导出。组件可以通过提供选择器 (`selector`) 精确订阅关注的状态切片（Slice），仅在局部树状数据变化时触发重渲染，避免了根级 Context Provider 更新引发的性能雪崩。
- **上下文提供者**：`AppStateProvider` 管理了 Store 的单例注入，同时顺带挂载了 `MailboxProvider` 与动态（DCE 裁剪）的 `VoiceProvider`。

### 3. 状态级联与外部副作用同步 (`onChangeAppState.ts`)
设计了一种拦截器模式，在每次发生状态变更后侦听特定路径的变化以触发副作用（Side-Effects）。
- **配置持久化**：深度比对 `oldState` 与 `newState`。若如 `mainLoopModel` 或 UI 视图开关等状态发生改变，将自动序列化并调用 `saveGlobalConfig` 落地到磁盘，实现了 State 到 Disk 的响应式同步。
- **跨进程同步（CCR）**：对于 `toolPermissionContext.mode` 的变更，该处充当单一咽喉点，自动触发 `notifySessionMetadataChanged` 将权限模式同步至后端的 CCR 容器。
- **缓存驱逐**：当探测到全局的密钥配置（AWS/GCP 或 API Key）发生改变，立即清空内存凭据缓存，迫使下一次请求重载令牌。

### 4. 派生视图与辅助域操作
- **纯函数选择器 (`selectors.ts`)**：提供无副作用的组合式读取逻辑，例如根据是否处于 `viewingAgentTaskId` 动态路由控制台输入至 Leader 或本地代理 (`getActiveAgentForInput`)。
- **队友视图流转 (`teammateViewHelpers.ts`)**：封装了子代理（Teammate）状态 UI 展示层的硬逻辑。包含针对任务的 `retain`（保持生命周期防止销毁）以及 `evictAfter`（标记定时清除垃圾）的切换与调度管理。

## 维护规范

- **单向数据流与副作用隔离**：严禁在 `AppStateStore` 或 UI 组件的渲染过程中直接抛出针对文件系统或网络的副作用，必须统一通过 `onChangeAppState.ts` 或异步 Action（如 Commands/Hooks）解耦。
- **切片渲染阻断（Render Bailing）**：在组件中使用 `useAppState(s => s.something)` 时，选择器必须返回基础类型或原对象的引用，严禁在选择器内部返回新字面量对象或执行数组 `.map()`，否则将击穿 `Object.is` 比较导致死循环或无限重渲染。
- **类型安全**：随着 `AppState` 字段持续膨胀，新增字段需提供完备的类型说明并初始化于 `getDefaultAppState`，必须确保对深层对象的嵌套解构操作不存在 `undefined` 风险。
