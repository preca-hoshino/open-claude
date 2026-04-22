# src/assistant — 助手会话模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/remote/README.md`](../remote/README.md)（会话层）

## 简介

Assistant 模块主要承载智能助手会话相关的核心前端和逻辑代码，包括会话生命周期管理、历史记录管理以及会话选择界面。它是连接底层 API 请求与上层交互的关键枢纽。

## 目录结构

```
assistant/
├── index.ts                         # 模块统一导出入口
├── gate.ts                          # 权限或网关拦截逻辑
├── sessionDiscovery.ts              # 会话发现机制，定位和恢复可用会话
├── sessionHistory.ts                # 会话历史记录的持久化和读取
├── AssistantSessionChooser.tsx      # React 终端组件：交互式选择会话
└── __tests__/                       # 测试目录
    └── ...
```
