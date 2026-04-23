# src/migrations — 迁移脚本模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/server/README.md`](../server/README.md)（后端服务可能涉及数据库及设置）

## 简介

本模块包含项目的所有状态与配置迁移（Migrations）脚本。当应用的默认配置、数据结构、或是依赖的模型版本发生不兼容变更时，通过该目录下的迁移脚本来保证老版本用户的本地状态能够平滑升级。

## 目录结构

```text
migrations/
├── __test__/                                           # 针对各类迁移脚本的自动化测试文件
├── migrateAutoUpdatesToSettings.ts                     # 迁移自动更新配置到统一设置文件
├── migrateBypassPermissionsAcceptedToSettings.ts       # 迁移权限放行配置到统一设置文件
├── migrateEnableAllProjectMcpServersToSettings.ts      # 迁移 MCP 服务启用状态配置
├── migrateFennecToOpus.ts                              # 模型变更：从 Fennec 升级到 Opus
├── migrateLegacyOpusToCurrent.ts                       # 模型变更：从 Legacy Opus 升级
├── migrateOpusToOpus1m.ts                              # 模型变更：升级为支持 1M 上下文的 Opus
├── migrateReplBridgeEnabledToRemoteControlAtStartup.ts # 迁移 REPL 桥接启用状态至远程控制设定
├── migrateSonnet1mToSonnet45.ts                        # 模型变更：升级至 Sonnet 4.5
├── migrateSonnet45ToSonnet46.ts                        # 模型变更：升级至 Sonnet 4.6
├── resetAutoModeOptInForDefaultOffer.ts                # 重置默认提供的 Auto 模式相关状态
└── resetProToOpusDefault.ts                            # 将 Pro 版默认模型重置为 Opus
```

## 实现逻辑细节

### 1. 状态的安全迁移与降级回滚保护
迁移脚本的执行高度依赖于底层的配置存取函数（如 `getGlobalConfig` 和 `getSettingsForSource`）。为了确保即使在用户本地环境极其恶劣或存储文件被锁定时，也不会因为迁移失败而导致整个应用崩溃（Crash Loop），所有迁移函数均被包裹在健壮的 `try-catch` 块中。失败时，系统将使用 `logError` 输出错误信息并触发遥测（`logEvent`），而不会向外抛出致命错误，确保主程序的强韧性。

### 2. 即时生效机制与旧配置清理
以 `migrateAutoUpdatesToSettings.ts` 为例：迁移不仅负责将旧配置项（如废弃的 `autoUpdates` 参数）转存至新的配置文件存储中（转换为 `DISABLE_AUTOUPDATER` 环境变量设置），还会即时修改当前的运行时上下文（如直接写入 `process.env`），确保迁移在当前进程生命周期中立刻生效。迁移完成后，脚本会自动清理 `globalConfig` 中残留的冗余旧字段，保持配置体积的轻量化。

### 3. 大模型代际切换的自动路由
当后端提供的大模型服务（例如 Anthropic 宣布下线或替换某一代际模型）发生重大更迭时，由于客户端会缓存用户上次使用的模型 ID，如果不做处理就会导致 404 或非法请求报错。通过此类迁移脚本（如 `migrateSonnet1mToSonnet45`），系统在启动时会主动遍历用户保存的偏好列表。如果匹配到已被标记为弃用的模型名，将其安全映射更新到最新替代款，从而向用户屏蔽底层 API 变动带来的破坏性体验。

## 新增 / 重构 / 删除向导

### 新增
- 当定义了新的且不兼容旧格式的配置存储，或上游接口弃用某个常用模型时，在此目录下新增对应的迁移脚本文件。
- 新增脚本应在 `__test__` 中包含全面的向前/向后兼容性测试，确保新老版本状态交替时的严密逻辑。
- 注意在系统启动逻辑（通常是 bootstrap 或应用初始化点）中注册并调用该新增迁移。

### 重构
- 如果迁移框架或基础配置存取类接口改变，需要同步检查并重构本目录下所有涉及相关 API 读写的脚本。
- 保证每个脚本拥有极高的健壮性，绝不能因为某一项 JSON 字段的类型反序列化失败导致后续流程阻断。

### 删除
- 在新版本中，某些极其古老的迁移脚本如果被证实对于 99% 的活跃用户已经执行完毕且无需长期保留，可以安全删除以减轻维护负担。
- 删除时务必从启动调用链和测试套件中同时移除对应的引用。
