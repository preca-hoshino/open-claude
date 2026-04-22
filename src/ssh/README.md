# src/ssh — SSH 连接模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/remote/README.md`](../remote/README.md)（远程连接）

## 简介

SSH 模块负责管理基于 SSH 协议的远程连接和会话。它提供了建立、维护和销毁 SSH 链接的核心能力，以便助手能够安全地操作远程主机或执行跨设备指令。在外部开源版本中作为抽象存根保留。

## 目录结构

```text
ssh/
├── SSHSessionManager.ts             # 管理多个 SSH 会话实例的生命周期（未开源版本存根）
├── createSSHSession.ts              # 提供建立单个 SSH 会话的工厂方法（存根）
└── __test__/                        # 测试目录
    └── ...
```

## 实现逻辑

### 抽象接口定义
`createSSHSession.ts` 定义了完善的 `SSHSession` 接口类型约定，涵盖了指令执行 (`execute`)、进程管理、双向通信通道构建等核心能力。

### 运行时占位防御
开源版本中调用 `createSSHSession` 将抛出 `SSHSessionError`（提示 SSH 功能在开源构建中不可用），从而拦截错误调用，并在系统层面上确保接口规范一致性。

## 新增 / 重构 / 删除向导

### 新增
- 拓展 SSH 能力前，需在 `SSHSession` 接口定义中添加新方法，确保存根侧与闭源实现侧类型对齐。

### 重构
- 如果对连接控制协议（如消息格式、认证鉴权机制）进行重构，请务必关注依赖该接口的上层调用者（如 `remoteSessionManager`），避免引起类型或流程错误。

### 删除
- 如果废弃底层 SSH 通信支持，应先剥离与之相关的命令参数及初始化逻辑，然后全量清除 `SSHSession` 接口与对应的占位符。
