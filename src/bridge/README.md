# src/bridge — 后端服务端与直连会话模块
> 参见 [README.md](../../README.md) 项目总览
> 关联模块：[src/commands/bridge](../commands/bridge/README.md) 提供本模块的 CLI 入口与配置解析；[src/hooks](../hooks/README.md) 中的 `useReplBridge` 用于在 REPL 前端挂载并消费本模块状态。

## 简介
本模块主要负责建立并管理本地终端与远端服务器（如 claude.ai）的双向通信通道，实现本地命令行与远端界面的直连控制与状态同步。机制上通过短轮询任务队列与长连接（WebSocket / SSE）数据流相结合的方式，动态接管子进程生命周期与控制指令互传。本模块作为基础通信层，服务于 CLI 层的 Remote Control 远程接管功能以及 Cowork 守护后台的并发执行调度。

## 目录结构
```text
├── bridgeApi.ts # 封装与后端服务端（API）通信的请求方法与状态验证
├── bridgeConfig.ts # 定义桥接模块的环境与网络连接配置项
├── bridgeDebug.ts # 提供网络故障注入与调试句柄机制
├── bridgeEnabled.ts # 提供检查远程控制功能启用状态的工具函数
├── bridgeMain.ts # 核心守护进程主循环，负责多会话生命周期调度与任务轮询
├── bridgeMessaging.ts # 处理本地进程与远端 SDK 间消息格式转换与协议序列化
├── bridgePermissionCallbacks.ts # 拦截并处理远端下发的权限控制请求
├── bridgePointer.ts # 管理崩溃恢复指针，记录运行态信息至本地磁盘
├── bridgeStatusUtil.ts # 提供时间与状态展示的格式化工具
├── bridgeUI.ts # 在终端渲染桥接进程的实时运行状态与监控面板
├── capacityWake.ts # 实现容量唤醒信号量机制，用于会话结束时打断休眠
├── codeSessionApi.ts # 提供精简版会话创建接口，专供无环境上下文依赖的后台任务使用
├── createSession.ts # 封装标准会话的初始化、认证与云端环境绑定逻辑
├── debugUtils.ts # 包装网络错误的日志输出与脱敏处理
├── envLessBridgeConfig.ts # 提供无本地环境依赖的默认配置回退项
├── flushGate.ts # 序列化消息推送队列，防止历史消息与新消息因竞态乱序
├── inboundAttachments.ts # 解析并反序列化来自远端的文件附件与内联资源
├── inboundMessages.ts # 拆解与路由来自远端 WebSocket/SSE 的控制指令与文本
├── initReplBridge.ts # 组合核心依赖并启动针对单终端 REPL 的专有桥接循环
├── jwtUtils.ts # 维护会话接入凭证（JWT）的解析与后台主动刷新定时器
├── peerSessions.ts # 定义端到端直接通信的内部会话结构
├── pollConfig.ts # 对接 GrowthBook 配置中心动态获取轮询频率与策略
├── pollConfigDefaults.ts # 定义退化情况下的轮询间隔安全默认值
├── remoteBridgeCore.ts # 远端核心控制器，包装生命周期管理以供多场景复用
├── replBridge.ts # 针对交互式终端的专用桥接逻辑，管理本地 REPL 与远端界面的双向流
├── replBridgeHandle.ts # 定义供给 React 渲染层调用的桥接状态与接口句柄
├── replBridgeTransport.ts # 封装异构网络层，抽象 V1 (WebSocket) 与 V2 (SSE) 传输实现
├── sessionIdCompat.ts # 处理新旧版本 Session ID 前缀兼容转换
├── sessionRunner.ts # 基于独立进程启动子任务执行器（Claude 子进程）
├── trustedDevice.ts # 获取并组装本地可信设备凭证信息
├── types.ts # 声明网络协议、环境上下文与桥接核心组件的 TypeScript 类型定义
├── webhookSanitizer.ts # 过滤与净化 Webhook 负载中的敏感字段
└── workSecret.ts # 解析后端下发的工作流密钥负载以组装认证凭证
```

## 实现逻辑
### 1. 主循环与任务轮询
入口：`bridgeMain.ts` 中的 `runBridgeLoop`
本模块通过向远端持续轮询工作队列（Poll For Work）获取任务。为了在空闲时节省连接资源并防止网络假死，机制采用了带有指数退避（Exponential Backoff）的非独占心跳与轮询策略。当获取到有效任务后，模块将解析下发的密钥，提取出用于鉴权接入的凭证（Token），并为新任务初始化独立的上下文资源以供调度。

### 2. 交互式会话桥接
入口：`replBridge.ts` 中的 `initBridgeCore`
交互式终端通过专属循环建立双向通道，通过底层传输层屏蔽了 HTTP SSE 与 WebSocket 的差异。此机制会将远端界面的消息（如文本输入或权限决策结果）注入到本地处理队列中，并将本地产生的结果或运行状态（例如工具执行状态）逆向汇报给远端，确保两端界面的状态一致性。为了处理网络抖动，底层实现了基于序列号（Sequence Number）的会话恢复与历史消息重播拦截机制，避免消息重放导致状态机错乱。

### 3. 会话隔离与进程调度
入口：`sessionRunner.ts` 中的 `createSessionSpawner`
在收到多并发任务（如 Cowork 并发工作）时，模块能够通过工作树（Git Worktree）或同目录模式隔离多个运行空间。每个子任务均被封装为独立的 Node.js 子进程启动，其标准输入与输出被重定向并纳入主桥接进程监控。这种机制有效隔离了业务执行单元，防止了单一死锁或内存溢出导致整个主桥接服务崩溃，并配合超时看门狗实现长期僵死进程的硬杀操作。

### 4. 状态同步与环境灾备
入口：`jwtUtils.ts` 与 `bridgePointer.ts`
由于接入凭证（JWT）具有严格的存活周期，模块中维持了一个后台刷新控制器，在凭证过期前主动触发静默续期。同时，为了防范物理机睡眠或进程意外被杀死，模块在运行时会将核心环境句柄写入本地磁盘指针（Bridge Pointer）。在系统复苏或用户通过指令接管时，机制会自动读取该指针发起快速服务端重连，无缝接管中断的服务端会话。

## 新增 / 重构 / 删除向导
### 新增
新增不同类型的通信事件或交互协议时，请在 `types.ts` 定义协议载荷结构，并在 `bridgeMessaging.ts` 中注册对应的类型路由与解析逻辑；若新增底层传输通道，请在 `replBridgeTransport.ts` 中继承并补充适配器实现。请务必为新协议载荷补充集成测试或单元测试验证。

### 重构
重构环境标识、Session ID 等关键字段验证逻辑时，必须保障对既有版本标识符（如兼容处理 `cse_` 与 `session_` 前缀）的向后兼容；本模块网络层含有安全失败（Fail-safe）策略，当连续遇到凭证鉴权失败或网络环境无法复苏超过最大阈值时，必须强制切断通道并向上游安全抛出中断异常，禁止屏蔽 401/403 异常而维持伪活跃连接。

### 删除
当需要下线旧版本传输协议（如废弃 WebSocket 模式）或废除某个本地通信子特性时，请在剥离本模块源文件前，明确要求追溯并清理上游调用方（如 `src/cli/` 或对应的 `hooks`）中的控制标志位与配置入口；正式清理前必须发布弃用警告通知所有本地运行中的残留进程实例。
