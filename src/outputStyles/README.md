# src/outputStyles — 终端样式输出模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/components/README.md`](../components/README.md)（终端 UI 组件）

## 简介

OutputStyles 模块用于控制 CLI 和终端环境下的文本输出格式与颜色样式加载。它确保项目在命令行交互时拥有统一且可读的终端主题呈现。

## 目录结构

```text
outputStyles/
├── loadOutputStylesDir.ts           # 负责加载并注册预设样式的逻辑
└── __test__/                        # 测试目录
    └── ...
```

## 实现逻辑

### 样式动态加载
`loadOutputStylesDir.ts` 利用文件系统探针扫描预设的样式字典（可能存在于特定配置路径），并把对应的色值和格式定义注入到全局的 Chalk/Ink 上下文中。

### 运行时主题映射
系统输出（例如调试日志、AI 回复文本）通过该模块定义的映射关系，将内部抽象的主题语义（如 error、info、highlight）渲染为适合不同类型终端的 ASCII 转义序列。

## 新增 / 重构 / 删除向导

### 新增
- 引入新的语义化色值或预设排版库时，必须将样式定义在独立的文件中，并通过 `loadOutputStylesDir` 提供热载支持。
- 应提供针对 256 色及真色彩终端环境的回退样式测试。

### 重构
- 替换终端着色库（如 Chalk 到 Colorette）时，需确保导出签名的稳定性，避免引起数以百计的外部模块报错。

### 删除
- 清理废弃样式前应先在各级输出（Logger、Ink 视图）中搜索关键字，确保不再有组件依赖这些样式标记。
