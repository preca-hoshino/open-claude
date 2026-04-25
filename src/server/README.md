# src/server — 后端服务端与直连会话模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/coordinator/README.md`](../coordinator/README.md)（协同调度）、[`src/ssh/README.md`](../ssh/README.md)（涉及底层网络连接）

## 简介

本模块主要负责应用运行时的核心网络服务（Server）与会话管理（Session Management）。它提供了建立直连（Direct Connect）、维护后端状态锁（Lockfile）及处理客户端请求所需的基础设施，充当了本地应用与远端代理（或守护进程）之间的核心通信枢纽。

## 目录结构

```text
server/
├── __test__/                        # 服务相关功能的自动化测试用例
├── backends/                        # 特定后端实现，如 dangerousBackend
├── connectHeadless.ts               # 无头模式连接入口
├── createDirectConnectSession.ts    # 建立直连通信会话的工厂逻辑
├── directConnectManager.ts          # 直连状态管理器，维护会话的生命周期与双向通信协议
├── lockfile.ts                      # 进程级/服务级文件锁，防止并发冲突
├── parseConnectUrl.ts               # 连接 URL 解析器
├── server.ts                        # 核心服务入口与主进程调度
├── serverBanner.ts                  # 服务启动时在终端打印的横幅信息
├── serverLog.ts                     # 服务专用的日志处理设施
├── sessionManager.ts                # 全局会话状态管理
└── types.ts                         # 本模块内使用的各种网络请求与会话的类型定义
```

## 实现逻辑细节

### 1. 基于 WebSocket 的双向直连协议 (Direct Connect)
`directConnectManager.ts` 实现了 `DirectConnectSessionManager` 类，负责与代理节点的 WebSocket 长连接。它内部设计了一个事件循环：
- **消息过滤与序列化**：通过 `jsonParse` 逐行解析收到的消息流。只有合法的 `StdoutMessage` 会被放行。
- **控制指令隔离**：对于 `control_request` 类型的系统信令（例如工具调用的鉴权请求 `can_use_tool`），会直接被拦截并派发到专用的 `onPermissionRequest` 回调，避免和普通大模型对话流混合。
- **中断与状态干预**：系统可通过管理器暴露的 `sendInterrupt` 向后端发送取消指令（`control_cancel_request`），在网络层直接阻断模型生成。

### 2. 互斥锁机制与多实例防护 (Lockfile)
为了保证多个客户端实例（或后台 Daemon 进程）在同时读写配置或抢占端口时不发生竞态条件，本模块通过 `lockfile.ts` 提供了一个进程级的文件锁方案。当检测到已经有 Server 在运行时，后来启动的实例将通过探针（`probeRunningServer`）获取运行中实例的 PID 和 HTTP 地址，直接以客户端模式挂载上去，而不是强行抢夺控制权。

### 3. 高危后端执行沙盒 (Dangerous Backend)
在 `backends/dangerousBackend.ts` 中，服务端抽象出了一层用于执行带有极高破坏性系统指令的“危险后端”。由于该后端可能具有修改文件系统或执行任意 Shell 代码的权限，它在 Server 启动阶段会被严格的鉴权与配置路由所隔离，只有当明确在本地安全上下文中或拿到高权限的连接 Token 时才会开放通信。

## 新增 / 重构 / 删除向导

### 新增
- 当增加新的服务器启动参数、连接方式或新增 API 通信指令（例如新增一种 `control_request` 子类型）时，优先在 `types.ts` 定义数据结构。
- 新增网络通信逻辑应优先集成到 `DirectConnectSessionManager` 中，并在 `__test__` 中补充连通性和重发机制测试。

### 重构
- 任何关于直连握手协议及 JSON 载荷结构的改动（如修改 `sendMessage` 打包格式）都属于高风险变更，必须确保前后端版本配对向下兼容。
- 改变 Socket 解析逻辑时，注意捕获 `jsonParse` 可能抛出的异常，不能因为某一条残缺消息导致整个连接断开。

### 删除
- 如果要废弃某种过时的后端连接模式或协议类型，须一并清理 `backends` 中的旧实现，从入口 `server.ts` 删除相应的启动分支。
