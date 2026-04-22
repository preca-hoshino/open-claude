# src/ssh — SSH 连接模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/remote/README.md`](../remote/README.md)（远程连接）

## 简介

SSH 模块负责管理基于 SSH 协议的远程连接和会话。它提供了建立、维护和销毁 SSH 链接的核心能力，以便助手能够安全地操作远程主机或执行跨设备指令。

## 目录结构

```
ssh/
├── SSHSessionManager.ts             # 管理多个 SSH 会话实例的生命周期
├── createSSHSession.ts              # 提供建立单个 SSH 会话的工厂方法
└── __test__/                        # 测试目录
    └── ...
```
