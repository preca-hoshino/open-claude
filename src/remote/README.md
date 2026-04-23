# 远程会话与通信模块 (`remote`)

本模块主要负责处理客户端与远程 CCR (Claude Container Runtime) 服务器之间的会话连接、状态维持及数据协议转换。它是确保远程代理（Remote Agent）能够稳定、安全地与前端应用交换核心指令和状态信息的通信中枢。

## 核心实现逻辑

### 1. WebSocket 会话管理 (`SessionsWebSocket.ts`)
该组件封装了底层的 WebSocket 连接逻辑，承载着服务端 `SDKMessage` 数据流的接收与生命周期控制。
- **协议握手与认证**：支持 `ws://` / `wss://` 连接，并在连接阶段通过 Header `Authorization` 及 `anthropic-version` 完成隐式鉴权。
- **重连与容错**：区分“瞬时断开”（如 4001 session not found）与“永久性拒绝”（如 4003 unauthorized）。针对服务端 Compaction（状态收缩）引发的 4001 错误设计了有限次短线重试策略；内置基于时间窗的心跳包（Ping）保活机制。
- **同构适配**：基于 `globalThis.WebSocket` 与 Node.js 的 `ws` 实现双端适配，并内建对 Proxy/TLS 配置项的支持。

### 2. 远程会话协调器 (`RemoteSessionManager.ts`)
作为业务层的控制中枢，统筹 WebSocket 下行事件与 HTTP 上行指令。
- **消息分发机制**：监听 WebSocket 并通过类型断言 `isSDKMessage` 将控制指令（如 `control_request`）与常规聊天消息流剥离。
- **权限流转控制**：重点维护 `pendingPermissionRequests` 队列，当拦截到远程工具执行的权限诉求（`can_use_tool`）时，将其桥接至前端审批，并异步回写 `control_response`。
- **双通道通信**：接收服务端事件依赖 WebSocket 订阅，而发送用户消息则依靠独立的 HTTP POST（调用 `sendEventToRemoteSession`），保障了双工通信的解耦性。

### 3. SDK 消息协议适配器 (`sdkMessageAdapter.ts`)
远程服务器下发的 `SDKMessage`（如 `SDKAssistantMessage`, `SDKSystemMessage` 等）在结构上异于本地前端直接消费的 UI 视图模型。
- 该文件充当了一层严格的反序列化映射（Adapter Pattern），将诸如 `stream_event`、`tool_progress` 等生硬指令平滑映射为前端理解的 `StreamEvent` 或 `SystemMessage`。
- 特别针对 `tool_result` 等含有富文本嵌套的数据块提供了智能展平（Flattening）处理。

### 4. 远程权限沙盒桥接 (`remotePermissionBridge.ts`)
由于远程实例可能携带客户端尚未注册的动态工具（如 MCP tools），本地环境需要建立安全沙盒予以处理。
- **工具存根（Tool Stub）**：通过 `createToolStub` 为未知的远程工具动态生成仅具签名的占位工具，强制约束未注册能力的默认流向（FallbackPermissionRequest）。
- **合成消息流**：通过 `createSyntheticAssistantMessage` 伪造对话上下文本机副本，确保在完全远程计算的场景下，本机的确认流（Confirm UI）仍然能提取并渲染准确的 Tool Context。

## 维护规范

- **通信鲁棒性**：任何关于 `SessionsWebSocket.ts` 中重试或心跳频率常量的修改，必须兼顾弱网环境及不同宿主系统的 GC（垃圾回收）停顿行为，严禁随意缩短重连退避时间。
- **协议兼容性**：在 `sdkMessageAdapter.ts` 新增对不明来源 `message.type` 的解析前，需保证默认的 `ignored` 回退逻辑稳健运作，防止服务端增量迭代（如增加事件类型）引发客户端解析崩溃。
- **异常捕获**：WebSocket 的底层 `Error` 必须统一收束抛出并转换为受控的系统事件流传递给 UI 顶层，禁止发生未捕捉异常阻断主线程。
