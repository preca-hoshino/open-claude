# src/stubs — 外部依赖存根模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/plugins/README.md`](../plugins/README.md)

## 简介

Stubs 模块用于存放与系统外部环境或依赖交互的桩代码（Stub）和存根。特别是在 MCP (Model Context Protocol) 扩展以及跨环境调用场景中提供测试与交互桩。

## 目录结构

```
stubs/
└── ant/                             # 相关系统的预留桩
    └── __test__/                    # 测试目录
```
