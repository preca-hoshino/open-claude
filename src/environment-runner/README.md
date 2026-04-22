# src/environment-runner — Environment Runner 模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/self-hosted-runner/README.md`](../self-hosted-runner/README.md)（相似类型的 Runner）

## 简介

本模块负责环境 Runner（Environment Runner）的入口点与执行逻辑。Environment Runner 主要用于在特定环境中执行代码或任务，提供隔离、受控的执行上下文。当前在外部构建版本中主要以存根（Stub）形式提供类型兼容。

## 目录结构

```text
environment-runner/
├── main.ts                          # Environment Runner 的主执行入口（当前为存根）
└── main.test.ts                     # 针对 main.ts 的单元测试
```

## 实现逻辑

### 隔离执行入口
`environmentRunnerMain` 函数作为模块的主要调用入口，用于接收执行参数，预期在受控的沙盒或独立环境中启动任务执行逻辑。

### 跨版本存根兼容
为了兼顾内部与外部的构建差异，开源外部版本当前在 `main.ts` 中通过抛出 `not implemented` 错误的形式进行占位。这提供了一个类型安全的存根（Stub），使得依赖此 Runner 的上层调度代码可以无缝编译。

## 新增 / 重构 / 删除向导

### 新增
- 若需扩充环境配置能力，请在 `main.ts` 中扩展入口函数的参数类型，并在 `main.test.ts` 中补充校验用例。
- 必须确保存根版本和真实实现版本的函数签名完全对齐。

### 重构
- 如需更改运行时的上下文传递方式，请同步评估并修改同级的 `self-hosted-runner`，以保证所有 Runner 提供统一的接口协议。

### 删除
- 删除此模块前，必须全量检索顶层 CLI 入口（如 `src/cli/`）及构建脚本中是否强依赖了 `environmentRunnerMain` 导出。
- 若有引用，必须先在调用方移除对应的路由或分支逻辑。
