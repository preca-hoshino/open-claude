# src/tasks — 后台任务与执行状态管理模块

> 参见 [README.md](../../README.md)
> 相关模块：[src/state](../state) (共享与承载应用层 AppState 状态), [src/utils/task](../utils/task) (提供底层的状态机与框架钩子), [src/utils/sdkEventQueue.ts](../utils/sdkEventQueue.ts) (触发任务进度与完成事件至 SDK)

## 简介

本模块负责统一管理所有后台与面板级执行任务（如本地代理、远程会话、Shell 命令等）的生命周期、状态维护及进度跟踪。其核心机制是通过标准化各个异构执行体的 `TaskState` 结构，并结合状态机的更新机制、本地文件输出重定向以及轮询（Polling）或守护定时器（Watchdog），实现对异步任务的统一编排与终端用户级通知。本模块服务于应用状态层与前端 UI 呈现（如任务状态提示、消息拦截），是连接底层异构执行系统与应用表现层的中枢调度层。

## 目录结构

```text
├── DreamTask/                 # 记忆整合后台任务的状态包装，使其运行过程对 UI 可见
├── InProcessTeammateTask/     # 同进程队友的任务包装，管理特定团队身份、计划模式及待处理消息队列
├── LocalAgentTask/            # 本地代理与面板代理任务调度，负责进度提取、前后台模式切换及资源清理
├── LocalShellTask/            # 本地 Shell 命令任务调度，处理输出流监控、等待用户输入（Stall）检测及后台挂起
├── LocalWorkflowTask/         # 本地工作流后台任务调度包装器
├── MonitorMcpTask/            # MCP 监控任务包装器
├── RemoteAgentTask/           # 远程云端会话任务包装，负责远程拉取进程回显、阶段提取与超时打断
├── LocalMainSessionTask.ts    # 主会话后台化控制器，当用户触发后台模式时隔离其上下文与历史记录
├── pillLabel.ts               # UI 组件标签生成器，为终端底部状态指示器聚合和渲染精简任务文字摘要
├── stopTask.ts                # 全局停止任务入口，统一拦截终止请求并派发至具体类型的终止逻辑
└── types.ts                   # 任务类型系统聚合，定义 TaskState 联合类型并暴露判断后台任务的工具函数
```

## 实现逻辑

### 1. 任务生命周期管理与进度追踪
入口位于各子目录的任务核心文件（如 `LocalAgentTask.tsx`、`LocalShellTask.tsx`、`RemoteAgentTask.tsx`）。本模块针对每种任务分别实现了注册（`register`）、挂起后台（`background`）、状态监听以及清理（`kill`）的逻辑闭环。通过原子化的 `updateTaskState` 函数管理并发状态（如 `running`、`completed`、`failed`），并通过内部追踪器提取执行过程中的 Token 消耗量。

### 2. 异构任务的异常隔离与输出对接
核心文件（如 `LocalMainSessionTask.ts` 及 `LocalShellTask.tsx`）在初始化时分配子进程级 `AbortController`，通过将任务日志独立存储机制对接隔离环境。对于长时间运行未果的任务，例如在 `LocalShellTask` 内部利用 `startStallWatchdog` 监控日志变更行为，并基于正则匹配检测交互式等待提示（Interactive Prompt），以实现超时的自定识别。

### 3. 用户通知与 SDK 消息派发
`stopTask.ts` 与各个具体类型中的通知队列钩子（如 `enqueueAgentNotification`）作为跨端交互桥梁。任务转为终端态时拦截 `notified` 标志位（Flag）以避免冗余发送，将任务详情（包含成功或失败结果）压入消息队列供本地模型在下一轮感知，并同步触发 SDK 事件。

## 新增 / 重构 / 删除向导

### 新增
当引入新的后台任务类别时，请在子目录创建具体的任务包装文件，实现注册、后台化与 `kill` 方法；在 `types.ts` 中将新的状态接口补充进入 `TaskState` 和 `BackgroundTaskState` 联合类型；最后，在 `pillLabel.ts` 的 `getPillLabel` 和 `stopTask.ts` 分发路由中添加对新枚举类型的解析支持。

### 重构
修改当前任务轮询、状态变更或日志追踪逻辑时，请务必维持向后兼容性（Backward Compatibility）以适配已有的中断模式与后台模式切换过程；注意 `LocalShellTask` 和 `RemoteAgentTask` 具备安全失败（Fail-safe）设计：超时或强制退出时必须正确发送 SDK 结束事件并清理外部遗留进程，务必在重构中显式保留此安全策略。

### 删除
淘汰特定任务模块时，请移除其在 `src/tasks` 下的所有目录与文件；从 `types.ts` 的联合类型及 `pillLabel.ts` 中清除引用分支；并追溯并屏蔽项目中（如 UI 层或状态服务中）调起该类任务的所有上游注册调用点。
