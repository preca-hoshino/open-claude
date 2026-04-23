# src/schemas — 数据结构验证与模式定义模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/utils/settings/`](../utils/README.md)（配置存取逻辑，常与本目录的 Schema 产生依赖关联）

## 简介

本模块集中管理项目中关键领域实体的数据结构验证与模式定义（Schema Definitions）。目前主要通过 Zod 库来实现运行时的类型边界防守与数据清理。将特定的 Schema 定义独立抽取至此，有助于打破跨模块（尤其是配置管理与插件挂载之间）可能产生的循环依赖。

## 目录结构

```text
schemas/
├── __test__/                        # 针对各 Schema 校验边界的自动化单元测试
└── hooks.ts                         # 生命周期钩子（Hooks）相关的结构验证与类型声明
```

## 实现逻辑细节

### 1. 循环依赖的物理隔离 (Decoupling)
以 `hooks.ts` 为例：在重构前，Hooks 相关的配置模式定义存在于 `src/utils/settings/types.ts` 中。由于插件模块（如 `src/plugins/`）需要引用 Hooks 机制的验证规则，同时全局配置又需要引用插件定义来渲染，这就导致了典型的模块间交叉循环引入 (Circular Dependency)。通过将通用的底层业务实体和 Zod Schema 提取到中立的 `src/schemas/` 目录，多方均可以单向依赖此目录，彻底根除了 TS 编译和运行时潜在的循环引用黑洞。

### 2. 多态鉴权与可辨识联合 (Discriminated Unions)
在 `hooks.ts` 中，设计了复杂的 `HookCommandSchema`。它是一个通过 `type` 字段进行类型守卫的“可辨识联合”。无论是 `command`（本地 Shell 执行）、`prompt`（二次调用模型对话）、还是 `agent`（代理执行）和 `http`（发起请求），所有类型的钩子共用一套注册协议，但在字段层又各自严格隔离。例如，`command` 会强制校验是否携带了可用的 Shell 枚举，而 `http` 会对目标 URL 施加 `z.string().url()` 的严格正则判定。

### 3. 惰性求值优化 (Lazy Schema)
由于 Zod 的类型对象初始化会在加载时产生微小的内存和解析开销，本模块大量使用了项目自定义的 `lazySchema()` 高阶包裹器。这保证了即便是庞大如配置清单或工具联合类型的校验图谱，也只会在实际触发配置读取或数据验证的那一瞬间才被真正实例化，提升了 CLI 在极速唤醒场景下的首屏性能。

## 新增 / 重构 / 删除向导

### 新增
- 当出现任何因为“类型/结构共享”而在多个核心业务层（如 Server / Utils / Plugins / CLI）之间引发循环引入警告时，将该复杂类型连同其 Zod Schema 剥离到本目录。
- 新增 Schema 必须配合严格的边界定义（如 `.optional()`、`.describe()` 标注），不仅为了在开发期间获得自动补全，更能够结合代码分析器自动映射为配置文件表单 (UI Form) 的渲染提示词。

### 重构
- 任何对 Schema `z.object({...})` 中字段的重构，特别是引入 `transform()` 或更改字段名，都可能导致用户先前的磁盘 JSON 配置反序列化失败甚至自动被抹除（例如曾出现过的 `prompt` 字段被 `transform` 误吞的 BUG）。更改必须非常谨慎，必要时需要在 `src/migrations/` 中编写配置兼容迁移脚本。

### 删除
- 如果废弃某个业务实体模型（如移除了某种古老的协议），应在这里一并移除其 Schema 定义及由它推导出的 TypeScript 类型别名（`z.infer<>`），并全量扫描是否存在残留引用。
