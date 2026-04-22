# src/proactive — 主动式交互模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/assistant/README.md`](../assistant/README.md)（助手会话）

## 简介

Proactive 模块负责驱动系统的主动行为。它包含在特定触发条件下或后台静默运行时主动发起的任务与状态变更逻辑，提升助手的智能化程度与用户体验。

## 目录结构

```
proactive/
├── index.ts                         # 模块统一导出入口
└── __test__/                        # 测试目录
    └── ...
```
