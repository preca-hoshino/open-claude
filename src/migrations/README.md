# src/migrations — 数据迁移与版本兼容模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/server/README.md`](../server/README.md)（后端服务数据结构）

## 简介

本模块提供系统版本迭代过程中的配置与状态迁移（Migrations）方案。当应用在数据结构、默认配置或上游依赖（如大语言模型 API 标识）发生非向后兼容（Non-backward Compatible）变更时，本模块中的脚本负责在程序初始化阶段将遗留的用户本地数据安全转换为最新标准格式。

## 目录结构

```text
migrations/
├── __test__/                                           # 迁移逻辑的自动化单元测试
├── migrateAutoUpdatesToSettings.ts                     # 将更新策略迁移至系统环境变量配置
├── migrateBypassPermissionsAcceptedToSettings.ts       # 权限越权配置的规范化迁移
├── migrateEnableAllProjectMcpServersToSettings.ts      # MCP 服务注册状态的存储结构迁移
├── migrateFennecToOpus.ts                              # 模型路由：Fennec 标识映射至 Opus
├── migrateLegacyOpusToCurrent.ts                       # 模型路由：废弃 Opus 标识的标准化
├── migrateOpusToOpus1m.ts                              # 模型路由：扩充上下文规格至 1M
├── migrateReplBridgeEnabledToRemoteControlAtStartup.ts # REPL 桥接状态向远程控制标识的语义迁移
├── migrateSonnet1mToSonnet45.ts                        # 模型路由：Sonnet 4.5 版本升级映射
├── migrateSonnet45ToSonnet46.ts                        # 模型路由：Sonnet 4.6 版本升级映射
├── resetAutoModeOptInForDefaultOffer.ts                # Auto 模式默认挂载状态的重置逻辑
└── resetProToOpusDefault.ts                            # Pro 版本默认基座模型的重置逻辑
```

## 实现逻辑分析

### 1. 迁移任务的异常捕获与隔离
迁移任务在底层强依赖文件系统的 I/O 操作（通过 `getGlobalConfig` 和 `getSettingsForSource` 等接口）。为防范文件读写权限受限或并发进程持锁等边缘情况，所有的迁移函数均被封闭于严格的 `try-catch` 异常处理块中。发生抛错时，模块通过 `logError` 记录堆栈并通过 `logEvent` 上报诊断遥测，有效避免未捕获异常（Uncaught Exception）向上传递导致的主进程终止。

### 2. 配置项的热应用与存储回收
以 `migrateAutoUpdatesToSettings.ts` 的实现逻辑为例：该脚本首先将离散的配置参数序列化并转储为标准的环境变量字典（如 `DISABLE_AUTOUPDATER`）。写入持久化存储后，脚本会同步将该变量注入当前运行时内存（`process.env`），确保该策略在当前进程生命周期内即刻生效，无需重启进程。随后，系统执行对旧存储结构中冗余字段的内存释放与磁盘清理。

### 3. 上游接口变更的模型路由重定向
应对上游 API 提供商模型代际更替的场景，若直接下线旧模型会使客户端持有的缓存 ID 产生 HTTP 4xx 错误。本目录下的 `migrateSonnet*` 等脚本构建了一层拦截转换机制：在应用自举（Bootstrap）阶段遍历本地存储的偏好配置，匹配废弃正则模式，并将其指针重定向至推荐的对等新模型实例，从而屏蔽 API 迭代对客户端系统可用性的负面影响。

## 维护规范

### 新增规则
- 引入不向后兼容的数据存储变更或涉及核心模型废弃时，必须提供独立的原子化迁移脚本。
- 新增脚本需在 `__test__` 中提供完备的断言，覆盖包含旧格式解析、默认值兜底及幂等性（Idempotency）测试。
- 迁移入口须在系统自举主函数链中进行显式注册。

### 重构规则
- 若底层 I/O 驱动或配置序列化接口发生签名变更，须同步回归本目录下所有相关的持久化读写逻辑。
- 脚本必须保持严格的局部作用域设计，禁止引入对其它非核心工具库的强耦合。

### 废弃规则
- 对于生命周期已覆盖绝大多数活跃设备群体的历史迁移脚本，经遥测验证执行率达到指标后，可从代码库安全移除。
- 执行清理时，须同时从注册链路及测试用例集合中注销对应的模块引用。
