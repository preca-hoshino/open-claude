# src/types — 核心领域模型与类型定义

> 参见 [README.md](../../README.md)
> 关联模块：src/state（依赖本模块实现严格状态树类型约束）、src/entrypoints（引用本模块实现跨层级接口签名对齐）

## 简介
本模块负责集中定义系统全局使用的核心领域模型与 TypeScript 接口。其通过结构化类型声明与 Zod 运行时 Schema 双重机制，构筑了高内聚的类型安全防线。本模块服务于整个应用的所有业务逻辑层级与底层基础设施。

## 目录结构
```text
├── command.ts # 交互式指令与本地执行命令的类型结构
├── connectorText.ts # 连接器文本相关的辅助类型定义
├── fileSuggestion.ts # 文件补全与建议项的结构声明
├── generated/
│   └── ... # 外部协议或 API Schema 自动生成的类型代码目录
├── hooks.ts # 系统生命周期钩子（Hooks）及输入输出校验规范
├── ids.ts # 唯一标识符（UUID / Snowflake）相关类型限定
├── logs.ts # 结构化日志记录及输出格式的接口声明
├── message.ts # 核心消息总线协议及各类流转消息结构
├── messageQueueTypes.ts # 消息队列传递载荷的类型约束
├── notebook.ts # Jupyter/Notebook 式富文本单元格模型
├── permissions.ts # 权限控制、拦截策略与授权上下文模型
├── plugin.ts # 外部插件系统（Plugins）注册清单与配置元数据
├── statusLine.ts # 终端或前端状态栏渲染的数据结构
├── textInputTypes.ts # 交互式文本输入与终端按键捕获状态
├── tools.ts # 工具调用（Tool Use）参数与执行结果结构
└── utils.ts # 泛用基础类型工具（如深度只读转化等）
```

## 实现逻辑分析

### 1. 核心消息总线模型
以 `message.ts` 为入口，本模块通过可辨识联合类型（Discriminated Union）定义了应用骨干通讯协议。涵盖 `UserMessage`、`AssistantMessage`、`SystemMessage` 等变体，在系统消息内部按 `subtype` 进一步细分。这种设计通过类型收窄（Type Narrowing）确保渲染管线能够安全消费状态机转换。

### 2. 钩子与扩展系统契约
以 `hooks.ts` 与 `plugin.ts` 为核心，构建了系统扩展性基石。`hooks.ts` 使用 Zod 运行时校验结合编译期推导，建立安全回路。在此实现安全失败（Fail-safe）约束策略：通过传递受限的上下文，保障系统能在外部插件执行异常时实施安全阻断，并防止越权修改关键状态。

### 3. 指令与权限控制体系
在 `command.ts` 及 `permissions.ts` 中定义了调度策略与授权边界。指令支持内联执行与分支模式，通过 `isEnabled` 提供动态可用性计算。类型层强制分离未授权载荷，在编译期拦截敏感字段暴露的潜在风险。

### 4. 类型不可变约束机制
`utils.ts` 提供 `DeepImmutable<T>` 和 `Permutations<T>` 等类型工具。这些高级泛型被系统性用于强制约束权限上下文的只读属性，从而消除前端状态共享或并发场景下的竞态条件（Race Condition）与意外变异。

## 新增 / 重构 / 删除向导

### 新增
增加新类型定义时，请在对应文件补充接口声明；若涉及运行时数据校验，请务必补充对应的 Zod Schema 并在编译期对齐类型；随后执行自动化测试保障类型导出符合规范。

### 重构
修改现有核心类型前，务必评估其向后兼容性；若重构涉及权限拦截或故障敞口（Fail-open）策略相关的字段变动，请在提交信息中显式声明安全意图，严防静默降级导致安全边界被绕过。

### 删除
下线过时接口或 Schema 前，请全局搜索追溯并屏蔽所有上游调用方入口；对于外部公开协议的字段清理，请先标注废弃提示，待平滑过渡期结束后方可彻底移除物理代码。
