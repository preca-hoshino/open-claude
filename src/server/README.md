# src/server — 后端服务端与直连会话模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/coordinator/README.md`](../coordinator/README.md)（协同调度）、[`src/ssh/README.md`](../ssh/README.md)（涉及底层网络连接）

## 简介

本模块主要负责应用运行时的核心网络服务（Server）与会话管理（Session Management）。它提供了建立直连（Direct Connect）、维护后端状态锁（Lockfile）及处理客户端请求所需的基础设施，充当了本地与（可能存在的）远端服务节点之间的通信核心枢纽。

## 目录结构

```text
server/
├── __test__/                        # 服务相关功能的自动化测试用例
├── backends/                        # 特定后端实现，如 dangerousBackend
├── connectHeadless.ts               # 无头模式连接入口
├── createDirectConnectSession.ts    # 建立直连通信会话的工厂逻辑
├── directConnectManager.ts          # 直连状态管理器，维护会话的生命周期
├── lockfile.ts                      # 进程级/服务级文件锁，防止并发冲突
├── parseConnectUrl.ts               # 连接 URL 解析器
├── server.ts                        # 核心服务入口与主进程调度
├── serverBanner.ts                  # 服务启动时在终端打印的横幅信息
├── serverLog.ts                     # 服务专用的日志处理设施
├── sessionManager.ts                # 全局会话状态管理
└── types.ts                         # 本模块内使用的各种网络请求与会话的类型定义
```

## 实现逻辑

### 直连与会话管理
`directConnectManager.ts` 与 `sessionManager.ts` 是本模块的核心组件。负责监听与远端的连接状态，维护心跳机制，以及处理由于网络中断引发的断线重连逻辑。通过工厂函数（如 `createDirectConnectSession.ts`）实例化独立的连接上下文。

### 锁机制与防撞控制
为了保证多个客户端实例（或后台 Daemon 进程）在同时读写数据库或连接上游服务时不发生竞态条件，本模块通过 `lockfile.ts` 提供了一个跨平台兼容的文件锁实现。这使得只有一个主实例能接管核心写入权限，其他实例则以“客户端”模式工作或直接退出。

### 后端隔离层
`backends/` 目录用于封装特定的服务端执行逻辑（如 `dangerousBackend.ts`），其往往涉及对高危权限或系统深层接口的直接调用，被抽象在这里以便进行更严格的类型约束和安全审计。

## 新增 / 重构 / 删除向导

### 新增
- 当增加新的服务器启动参数、连接方式或新增 API 接口时，优先在 `types.ts` 定义接口和 Payload 数据结构。
- 新增网络通信逻辑应优先集成到现有的 `sessionManager.ts` 中以享受统一的心跳和断线恢复保护。并在 `__test__` 中补充连通性和超时处理测试。

### 重构
- 任何关于直连握手协议（Handshake）及 URL 解析（`parseConnectUrl.ts`）的改动都属于高风险变更，必须确保向下兼容旧版客户端发出的连接请求。
- 如需更改日志输出格式（`serverLog.ts`），须确保不影响 CLI 终端的正常 UI 刷新逻辑（通常由 `ink` 渲染）。

### 删除
- 如果要废弃某种过时的连接手段（例如只保留 SSH 或只保留 WebSocket），须一并删除对应的 `backends` 实现，并清理 `types.ts` 中遗留的连接枚举项。
