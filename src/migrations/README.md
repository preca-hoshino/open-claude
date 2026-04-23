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

## 实现逻辑

### 配置同步与状态升级
随着客户端版本的更迭，用户的本地配置项（如权限、更新偏好等）可能会改变存储位置或格式。迁移脚本通过特定的版本标识和转换函数将遗留格式解析并写入到新的设置管理器中，确保应用向后兼容。

### 模型代际切换
此目录中有大量关于大语言模型变更的脚本。当某个特定的模型版本被弃用或替换时，这些脚本负责自动将用户默认选用或历史保存的过时模型替换为最新的对等模型（如 `Sonnet45ToSonnet46`）。

## 新增 / 重构 / 删除向导

### 新增
- 当定义了新的且不兼容旧格式的配置存储，或上游接口弃用某个常用模型时，在此目录下新增对应的迁移脚本文件。
- 新增脚本应在 `__test__` 中包含全面的向前/向后兼容性测试。
- 注意在系统启动逻辑（通常是 bootstrap 或应用初始化点）中注册并调用该新增迁移。

### 重构
- 如果迁移框架或基础配置存取类接口改变，需要同步检查并重构本目录下所有涉及相关 API 读写的脚本。
- 保证每个脚本拥有极高的健壮性，确保失败时不会引发导致应用无法启动的雪崩错误。

### 删除
- 在新版本中，某些极其古老的迁移脚本如果被证实对于 99% 的活跃用户已经执行完毕且无需长期保留，可以安全删除以减轻维护负担。
- 删除时务必从启动调用链和测试套件中同时移除对应的引用。
