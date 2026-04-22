# src/dev — 开发环境专属模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/cli/README.md`](../cli/README.md)（命令行入口）

## 简介

Dev 模块主要包含了仅用于开发、调试、或是沙盒测试过程的逻辑。例如用于注入运行时的全局变量（globals）以绕过部分正式环境的安全限制和监控。

## 目录结构

```
dev/
├── installRuntimeGlobals.ts         # 运行时全局变量或特权代理注入
└── __test__/                        # 测试目录
    └── ...
```
