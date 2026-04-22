# src/environment-runner — Environment Runner 模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/self-hosted-runner/README.md`](../self-hosted-runner/README.md)（相似类型的 Runner）

## 简介

本模块负责环境 Runner（Environment Runner）的入口点与执行逻辑。Environment Runner 主要用于在特定环境中执行代码或任务，提供隔离、受控的执行上下文。

## 目录结构

```
environment-runner/
├── main.ts                          # Environment Runner 的主执行入口
└── main.test.ts                     # 针对 main.ts 的单元测试
```
