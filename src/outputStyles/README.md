# src/outputStyles — 终端样式输出模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/components/README.md`](../components/README.md)（终端 UI 组件）

## 简介

OutputStyles 模块用于控制 CLI 和终端环境下的文本输出格式与颜色样式加载。它确保项目在命令行交互时拥有统一且可读的终端主题呈现。

## 目录结构

```
outputStyles/
├── loadOutputStylesDir.ts           # 负责加载并注册预设样式的逻辑
└── __test__/                        # 测试目录
    └── ...
```
