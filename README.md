# claude-code-source

从 `@anthropic-ai/claude-code` npm 包完整还原的 Claude Code 源码项目。**无功能阉割** — 所有 native 模块、内部依赖、类型定义均已完整恢复，可直接在本地启动运行。

## 快速开始

```bash
# 安装依赖（需要 Bun >= 1.3.10）
bun install

# 启动（使用隔离配置目录 .claude-dev/，不影响宿主机）
bun run start

# MCP 服务器模式
bun run mcp

# 开发模式（文件监听热重载）
bun run dev
```

## 完整功能还原

### Native 模块 — 全平台覆盖

所有 native 模块均从各平台 Claude Code 编译二进制中通过 Mach-O / ELF / PE 解析器直接提取，**功能与官方发行版完全一致**：

| 模块 | 功能 | arm64-darwin | x64-darwin | arm64-linux | x64-linux | arm64-win32 | x64-win32 |
|------|------|:---:|:---:|:---:|:---:|:---:|:---:|
| **image-processor** | 图片处理、剪贴板图片读取、截图缩放 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **audio-capture** | 麦克风录音、音频播放、语音输入 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **computer-use-input** | 鼠标控制、键盘输入、屏幕交互 | ✅ | ✅ | — | — | — | — |
| **computer-use-swift** | 屏幕截图、应用管理、TCC 权限检测 | ✅ | ✅ | — | — | — | — |
| **url-handler** | macOS URL scheme 事件监听 | ✅ | ✅ | — | — | — | — |

> computer-use-input/swift 和 url-handler 是 macOS 系统 API，其他平台原生不支持，空缺项为平台限制而非功能缺失。

### 内部依赖 — 完整接入

| 包 | 状态 | 说明 |
|---|---|---|
| `@ant/computer-use-mcp` | ✅ 源码 + native | Computer Use MCP 服务器完整实现 |
| `@ant/computer-use-input` | ✅ 源码 + native | 键鼠输入控制（enigo/napi 绑定） |
| `@ant/computer-use-swift` | ✅ 源码 + native | macOS 屏幕截图和应用管理 |
| `@ant/claude-for-chrome-mcp` | ✅ 源码 | Chrome 扩展 MCP 桥接 |
| `@anthropic-ai/claude-agent-sdk` | ✅ npm | Agent SDK |
| `@anthropic-ai/bedrock-sdk` | ✅ 源码 + npm | AWS Bedrock 适配 |
| `@anthropic-ai/vertex-sdk` | ✅ npm | Google Vertex 适配 |
| `@anthropic-ai/foundry-sdk` | ✅ 源码 + npm | Azure Foundry 适配 |
| `@aws-sdk/*` | ✅ npm | AWS 认证和服务调用 |

### 核心功能 — 全部可用

| 功能 | 状态 | 说明 |
|------|------|------|
| CLI 交互 REPL | ✅ | 完整的终端交互界面 |
| 工具调用 | ✅ | Bash, FileEdit, FileRead, Grep, Glob, WebFetch 等全部工具 |
| MCP 服务器 | ✅ | 连接和管理 MCP servers |
| 斜杠命令 | ✅ | /help, /compact, /clear, /resume, /review 等 |
| 会话管理 | ✅ | 历史记录、会话恢复、多会话 |
| 权限系统 | ✅ | 工具权限控制、YOLO 模式、auto-accept |
| Bundled Skills | ✅ | claude-api、verify 等内置技能 |
| 插件系统 | ✅ | 插件安装、marketplace、MCP 插件 |
| OAuth 认证 | ✅ | claude.ai OAuth 登录流程 |
| Agent 子任务 | ✅ | 子 agent 派发、后台任务 |
| 图片处理 | ✅ | 截图、剪贴板图片、图片缩放 |
| 语音模式 | ✅ | 麦克风录音和语音输入（需 native 模块） |
| Computer Use | ✅ | 屏幕截图、鼠标键盘控制（macOS） |
| LSP 集成 | ✅ | Language Server Protocol 支持 |
| Git 集成 | ✅ | 工作树管理、commit、PR 操作 |
| Vim 模式 | ✅ | 终端 Vim 键绑定 |

### Feature Flags

源码中有 90+ 个 feature flag 通过 `bun:bundle` 的 `feature()` 控制。在 dev 模式（`bun run start`）下，这些 flag 由 Bun 运行时在 `if` 语句中求值。所有 feature flag 对应的代码**完整保留在源码中**，未做任何删减：

<details>
<summary>完整 Feature Flag 列表（90+ 个）</summary>

```
ABLATION_BASELINE          AGENT_MEMORY_SNAPSHOT      AGENT_TRIGGERS
AGENT_TRIGGERS_REMOTE      ALLOW_TEST_VERSIONS        ANTI_DISTILLATION_CC
AUTO_THEME                 AWAY_SUMMARY               BASH_CLASSIFIER
BG_SESSIONS                BREAK_CACHE_COMMAND         BRIDGE_MODE
BUDDY                      BUILDING_CLAUDE_APPS        BUILTIN_EXPLORE_PLAN_AGENTS
BYOC_ENVIRONMENT_RUNNER    CACHED_MICROCOMPACT         CCR_AUTO_CONNECT
CCR_MIRROR                 CCR_REMOTE_SETUP            CHICAGO_MCP
COMMIT_ATTRIBUTION         COMPACTION_REMINDERS        CONNECTOR_TEXT
CONTEXT_COLLAPSE           COORDINATOR_MODE            COWORKER_TYPE_TELEMETRY
DAEMON                     DIRECT_CONNECT              DOWNLOAD_USER_SETTINGS
DUMP_SYSTEM_PROMPT         ENHANCED_TELEMETRY_BETA     EXPERIMENTAL_SKILL_SEARCH
EXTRACT_MEMORIES           FILE_PERSISTENCE            FORK_SUBAGENT
HARD_FAIL                  HISTORY_PICKER              HISTORY_SNIP
HOOK_PROMPTS               IS_LIBC_GLIBC               IS_LIBC_MUSL
KAIROS                     KAIROS_BRIEF                KAIROS_CHANNELS
KAIROS_DREAM               KAIROS_GITHUB_WEBHOOKS      KAIROS_PUSH_NOTIFICATION
LODESTONE                  MCP_RICH_OUTPUT              MCP_SKILLS
MEMORY_SHAPE_TELEMETRY     MESSAGE_ACTIONS              MONITOR_TOOL
NATIVE_CLIENT_ATTESTATION  NATIVE_CLIPBOARD_IMAGE       NEW_INIT
OVERFLOW_TEST_TOOL         PERFETTO_TRACING             POWERSHELL_AUTO_MODE
PROACTIVE                  PROMPT_CACHE_BREAK_DETECTION QUICK_SEARCH
REACTIVE_COMPACT           REVIEW_ARTIFACT              RUN_SKILL_GENERATOR
SELF_HOSTED_RUNNER         SHOT_STATS                   SKILL_IMPROVEMENT
SLOW_OPERATION_LOGGING     SSH_REMOTE                   STREAMLINED_OUTPUT
TEAMMEM                    TEMPLATES                    TERMINAL_PANEL
TOKEN_BUDGET               TORCH                        TRANSCRIPT_CLASSIFIER
TREE_SITTER_BASH           TREE_SITTER_BASH_SHADOW      UDS_INBOX
ULTRAPLAN                  ULTRATHINK                   UNATTENDED_RETRY
UPLOAD_USER_SETTINGS       VERIFICATION_AGENT           VOICE_MODE
WEB_BROWSER_TOOL           WORKFLOW_SCRIPTS
```

</details>

## 源码还原方法

### 1. Source Map 提取（1,902 个文件）

npm 包 `@anthropic-ai/claude-code@2.1.88` 包含 `cli.js.map` (57MB)，其中有完整的 `sourcesContent`。源码经过 React Compiler 编译（函数参数重命名为 `t0`、添加缓存数组 `$`），但逻辑和类型定义完整保留。

### 2. 类型文件重建（~130 个文件）

纯类型文件（仅含 `type`/`interface`）在编译时被完全擦除，不出现在 source map 中。通过扫描全部 import 语句收集导出名称，再分析使用模式推断类型形状，重建了 `src/types/message.ts`（183 个文件引用）等关键类型定义。

### 3. Native 模块提取（20 个 .node 文件）

从 GCS distribution bucket 下载 4 个平台（darwin-arm64, darwin-x64, linux-x64, linux-arm64, win32-x64, win32-arm64）的 Claude Code 编译二进制，通过解析 Mach-O/ELF/PE 格式定位嵌入的 .node 共享库并提取。

### 4. TypeScript 编译修复

起始 1,556 个 tsc 错误，修复至 63 个（96%）。剩余错误均为不可修项：
- 50 个 `"external" === "ant"` 构建分支 dead code
- 12 个 `deps/@ant/computer-use-mcp` 第三方类型窄化
- 1 个 Zod 泛型推断

## 项目结构

```
├── src/                    # 主源码
│   ├── entrypoints/        # CLI / MCP / SDK 入口
│   ├── commands/            # 斜杠命令（/help, /compact, /review 等）
│   ├── tools/               # Agent 工具（Bash, FileEdit, WebFetch 等）
│   ├── components/          # Ink (终端 React) UI 组件
│   ├── services/            # MCP, OAuth, compact, LSP 等服务
│   ├── hooks/               # React hooks
│   ├── ink/                 # 自定义 Ink 终端渲染器
│   ├── types/               # 核心类型定义
│   ├── state/               # AppState (zustand store)
│   ├── skills/              # 内置技能（claude-api, verify）
│   └── utils/               # 工具函数
├── deps/                    # Anthropic 内部依赖
│   └── @ant/               # computer-use-mcp, chrome-mcp 等
├── vendor/                  # Native 模块（全平台）
│   ├── image-processor/     # 图片处理 (6 platforms)
│   ├── audio-capture/       # 音频采集 (6 platforms)
│   ├── url-handler/         # URL 事件 (macOS)
│   └── *-src/              # Native 模块封装层
├── global.d.ts              # 全局类型声明
├── text-imports.d.ts        # .md / React / Ink 类型声明
└── tsconfig.json
```

## 路线图 (Roadmap)

### v0：基础构建与稳定性提升 (当前阶段)
- [x] 完成代码和各平台 Native 模块的提取与还原
- [x] 修复大部分 TypeScript 编译报错及类型推断问题
- [x] 接入现代化的代码检查与分析工具 (ESLint, Biome, Knip)
- [ ] 剔除无法构建的硬编码分支与失效逻辑，保障构建稳定性
- [ ] 搭建自动化测试基础设施，补充核心及周边模块测试，目标达成 **100% 测试覆盖率**
- [ ] 统一并完善跨平台环境下的配置文件读取和挂载中心

### v1：核心功能精简与交互体验优化
- [ ] **鉴权与网络配置的全面显式化**：
  - 移除所有的后台遥测 (Telemetry) 与数据回传链路。
  - 废除原有的 OAuth 等隐式、强制登录绑定流程。整体改造为透明的配置驱动机制，支持用户在环境中显式指定 `baseUrl` 与 `apiKey`。
  - 优化系统提示词 (System Prompt)，去除内置冗余约束指令，提供纯粹干净的 Agent 环境。
  - 清理不再发挥作用的内部专有逻辑及废弃的 feature flags。
- [ ] **高度统一的模型调度与分级机制**：
  - 支持这 3 档模型档位与自定 `model_id` 的显式绑定关系配置，提供极致简洁的 `Haiku`、`Sonnet`、`Opus` 等级切换方式。
  - *注：系统将严格保持对 Claude API 格式的原生解析，**没有计划**去兼容或支持 OpenAI、Gemini 等其他格式的 API 端点。*
  
### v2：架构重构与底层执行效率突破
- [ ] 深度重构早期冗余且高耦合的代码逻辑，优化 Agent 的内部工作流决策与状态管理架构。
- [ ] 梳理整体执行链路，降低指令解析与上报过程的资源开销。
- [ ] 提取项目中耗时严重的关键链路（特别是高频文件扫描计算与重度 I/O 模块），尝试并逐步采用 **Rust** 原生重写，大幅提升运行性能。

## 许可证

本项目基于 `@anthropic-ai/claude-code` npm 包的公开分发内容。原始代码的版权归 Anthropic 所有，受其[许可条款](https://www.anthropic.com/legal/claude-code-terms)约束。本仓库仅用于研究和学习目的。
