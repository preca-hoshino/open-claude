# src/self-hosted-runner — Self-Hosted Runner 模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/environment-runner/README.md`](../environment-runner/README.md)（环境 Runner）、[`src/jobs/README.md`](../jobs/README.md)（任务调度）

## 简介

本模块负责 Self-Hosted Runner（自托管 Runner）的核心逻辑。Self-Hosted Runner 允许用户在自有基础设施上执行任务或作业，提供安全的本地执行环境与环境隔离机制。

## 目录结构

```
self-hosted-runner/
├── main.ts                          # Self-Hosted Runner 的主程序入口
└── main.test.ts                     # 相关单元测试
```
