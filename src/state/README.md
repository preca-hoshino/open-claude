# src/state — 全局状态管理与响应式容器

> 参见 [README.md](../../README.md)
> 关联模块：[src/bootstrap](../bootstrap/README.md)（应用启动时初始化并挂载状态树），[src/utils/settings](../utils/settings/README.md)（配置变更同步更新状态）

## 简介

本模块在系统中负责管理应用级别的全局状态并提供 React 组件层的响应式绑定。其核心机制基于轻量级的发布-订阅（Pub/Sub）模式构建状态存储（Store），结合 React 的 `useSyncExternalStore` 实现按需重渲染，并通过统一的侧作用拦截器同步外部系统。本模块服务于整个应用层，作为各个独立功能（如智能体、UI 视图、权限控制）之间数据流转的唯一事实来源。

## 目录结构

```text
├── AppState.tsx           # React 上下文提供者及使用 Hook（`useAppState` 等），实现状态的响应式绑定
├── AppStateStore.ts       # 全局状态树（`AppState`）的类型定义及默认初始状态工厂
├── onChangeAppState.ts    # 状态变更的全局副作用拦截器，负责同步配置项、清理缓存及通知外部服务
├── selectors.ts           # 纯函数选择器，用于从全局状态中衍生计算数据（如输入路由目标）
├── store.ts               # 框架无关的基础状态存储中心，实现发布-订阅机制
└── teammateViewHelpers.ts # 针对智能体视图切换的专属状态修改工具集，处理保留策略与退出逻辑
```

## 实现逻辑

### 1. 基础存储与响应式绑定
入口为 `store.ts` 及 `AppState.tsx` 中的 `useAppState`。该机制实现了一个无依赖的轻量级存储容器。为了在 React 中高效使用并避免不必要的全局重渲染，`useAppState` 利用了 `useSyncExternalStore` 订阅特定选择器的数据片段。这是一种典型的发布-订阅模式（Pub/Sub）。关键约束在于：传入的选择器必须返回基础类型或状态树中已有的对象引用，禁止在选择器中返回新建对象，否则会导致死循环重渲染。

### 2. 全局状态树定义
入口为 `AppStateStore.ts`。系统将所有的状态（从 UI 标志位到后台任务列表、权限模式）聚合在 `AppState` 接口中，并通过 `getDefaultAppState` 提供安全的初始值。为了保障单向数据流的安全，`AppState` 大量使用了深层不可变性（Deep Immutable）的约束，确保状态对象无法被意外突变。

### 3. 副作用拦截与状态同步
入口为 `onChangeAppState.ts` 的 `onChangeAppState` 函数。作为状态变更的旁路处理器，它会在每次调用 `setState` 时触发。它通过比对新旧状态的引用变化，决定是否需要将变更下刷至持久化配置（如 Settings）、重新计算环境变量、或向外部调用端发送状态变更通知（如权限模式切换的 CCR 报告）。此处的关键约束为：变更拦截器只允许执行外部副作用，绝不能在内部再次调用 `setState`，以防引发无限循环的竞态条件（Race Condition）。

## 新增 / 重构 / 删除向导

### 新增
在 `AppStateStore.ts` 中的 `AppState` 接口添加新字段，并同步更新 `getDefaultAppState` 中的默认值。若新字段需持久化，请在 `onChangeAppState.ts` 中添加比对逻辑，并桥接至相应的持久化工具。使用该状态的组件须通过 `useAppState(s => s.newField)` 订阅，并在测试用例中补充相应的状态覆盖。

### 重构
必须确保所有的状态修改遵循不可变更新原则；若修改涉及 `onChangeAppState.ts` 中的外部权限通讯机制或安全失败（Fail-safe）策略，请在此处显式校验并防范异常状态逃逸。

### 删除
当某状态下线时，请清理 `AppStateStore.ts` 中的类型定义及初始值设定，并移除所有引用该字段的组件端调用。必须追溯并屏蔽 `onChangeAppState.ts` 中针对该字段的所有拦截同步逻辑，确保不再污染外部持久化层。
