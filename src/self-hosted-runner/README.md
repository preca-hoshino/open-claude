# src/self-hosted-runner — Self-Hosted Runner 模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/environment-runner/README.md`](../environment-runner/README.md)（环境 Runner）、[`src/jobs/README.md`](../jobs/README.md)（任务调度）

## 简介

本模块负责 Self-Hosted Runner（自托管 Runner）的核心逻辑。Self-Hosted Runner 允许用户在自有基础设施上执行任务或作业，提供安全的本地执行环境与环境隔离机制。当前在外部构建中主要以存根（Stub）形式存在。

## 目录结构

```text
self-hosted-runner/
├── main.ts                          # Self-Hosted Runner 的主程序入口（存根）
└── main.test.ts                     # 相关单元测试
```

## 实现逻辑

### 自有基础设施任务分发
`selfHostedRunnerMain` 函数充当自托管任务执行的触发点。它设计为接受外部指令与参数，使得代理任务可以无缝转移至用户掌控的硬件上运行。

### 构建版本存根占位
与 `environment-runner` 类似，本模块在开源外部版本中仅提供函数签名一致的存根。调用时会抛出 `not implemented` 异常，保证系统的类型检查和导入树的完整性。

## 新增 / 重构 / 删除向导

### 新增
- 增加新的配置项或启动参数时，请在 `main.ts` 的参数定义中扩充，同时在 `main.test.ts` 添加边界测试用例。
- 确保相关配置的注入不会破坏现有的启动流。

### 重构
- 任何对入口函数签名的修改，都必须同步检查与之对应的 CLI 命令调用侧。
- 若引入特定于宿主机环境的依赖（如系统底层操作），需确保该依赖有跨平台兼容方案。

### 删除
- 如果决定弃用 Self-Hosted Runner 模式，除了删除本目录，还需清除调用端关于 "self-hosted" 的枚举或配置项。
