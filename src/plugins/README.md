# src/plugins — 插件与扩展架构模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：无（作为系统正交维度的能力扩充框架存在）

## 简介

本模块构成了系统级的扩展宿主架构（Extension Hosting Architecture），专门负责管理内置（Built-in）及捆绑（Bundled）的插件依赖集合。其核心目标是在保证底层命令分发框架封闭性的前提下，实现领域特定指令（Skills）、生命周期钩子（Hooks）以及模型上下文协议（MCP, Model Context Protocol）端点的模块化注入与动态调度。

## 目录结构

```text
plugins/
├── __test__/                        # 核心解析引擎与加载机制的单元测试
├── builtinPlugins.ts                # 插件注册表维护、依赖倒置与生命周期控制引擎
└── bundled/                         # 官方一元化打包分发的插件实体库
    ├── index.ts                     # 插件集合的初始化钩子与对外输出接口
    └── __test__/                    # 捆绑插件实现的端到端集成测试
```

## 实现逻辑分析

### 1. 命名空间隔离与注册表维护 (Registry)
`builtinPlugins.ts` 内部实现了一个常驻内存的哈希映射表（`BUILTIN_PLUGINS`）。为规避官方内置插件与预期内存在的第三方市场插件（Marketplace Plugins）在标识符空间上发生冲突，引擎在装载内置插件时，隐式为其 ID 追加了 `@builtin` 的命名空间后缀。该约束保证了核心路由能够通过统一标识符实现确定性的溯源与依赖检索。

### 2. 状态映射与运行时依赖修剪
区别于静态链接至解析器的底层原语操作（如 `/help`），内置插件的可见性受应用层用户状态映射制约。在 `getBuiltinPlugins` 解析管线中，系统将解析用户持久化配置中的 `enabledPlugins` 集合以构建抽象语法树（AST）级别的装配清单。若配置命中禁用状态或存在离线默认值，该插件注册的组件（Skills、Hooks、MCP Servers）将在对象构建期被显式剪枝（Pruning）。此策略将非活动插件从运行时执行栈中彻底隔离，有效控制了系统的常驻内存占用及序列化上下文负载（Token Overhead）。

### 3. 多态组件适配与优先级转换
单个插件实体支持多模态的组件输出。以 `getBuiltinPluginSkillCommands` 为例，引擎负责将特定域的数据结构（`BundledSkillDefinition`）适配并下行转化为系统标准的通用协议栈对象（`Command`）。在该适配流程中，引擎通过元数据注入（如显式声明 `source: 'bundled'`）实施了运行时优先级策略。这一机制使得内置工具库能够绕过标准的用户态上下文长度截断算法（Truncation Algorithm），确保高并发场景下基础设施指令集的绝对可用性。

## 维护规范

### 新增规则
- 新增插件宿主时（如引入新型解析器或 RPC 桥接服务），必须在 `bundled/` 下作为独立模块开发，保证职责单一。
- 必须在入口文件（`builtinPlugins.ts` 或 `bundled/index.ts`）的注册表中进行显式声明挂载，并补充相应的配置覆写测试。

### 重构规则
- 若需修改适配器函数（如 `skillDefinitionToCommand`）的映射逻辑，须严格保障上下游数据接口的一致性。元数据字段（如 `isHidden` 或 `userInvocable`）的缺失将直接触发前端交互界面的解析错误或指令拦截。

### 废弃规则
- 清理废弃或被底层收编的内置插件实体时，需同步擦除对应源码及 `builtinPlugins.ts` 的静态引用链路。系统的后续迭代将利用惰性加载机制自动抛弃用户历史配置中处于游离状态的标识符。
