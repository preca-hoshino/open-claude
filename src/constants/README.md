# 常量与全局配置模块 (`constants`)

本模块存储了贯穿整个 Open-Claude 系统的核心配置声明。它不仅是一系列静态值的集合，更是定义系统边界、API 限制、身份认证路由、提示词（Prompt）工程以及工具沙箱策略的“规则中枢”。为了避免循环依赖，本项目中大量跨模块的契约（Contract）在此统一定义。

## 核心实现逻辑与文件说明

### 1. 提示词引擎与上下文边界 (`prompts.ts`)
- **动态组装机制**：`getSystemPrompt` 函数负责构建 Claude 的全局 System Prompt。该配置依据当前模型 (`modelId`)、功能开关（如 `PROACTIVE` 或 `KAIROS`）、工作区状态（如 Git Worktree）、及特定用户的组织标签（如 Ant 员工专用配置）动态生成。
- **缓存边界 (`SYSTEM_PROMPT_DYNAMIC_BOUNDARY`)**：由于 System Prompt 是 Context Window 成本的大头，本模块强制切分了“全局静态常量”与“会话特定内容”。所有在此分界线前的字符都会在远端实现跨组织/跨用户的 Prompt Cache（极大降低成本），任何在此界线前的改动都必须极度谨慎，以防破坏缓存率（Cache Hit Rate）。

### 2. 多重环境与认证网关 (`oauth.ts`)
该文件支持多种网络平面的身份认证：
- **组织/环境路由**：定义了 `prod` (api.anthropic.com)、`staging` (.ant.dev 内部网段) 以及 `local` 端口的环境配置。
- **专有网络逃逸 (FedStart/PubSec)**：支持通过 `CLAUDE_CODE_CUSTOM_OAUTH_URL` 强行覆盖全局网关地址，但仅限在 `ALLOWED_OAUTH_BASE_URLS` 白名单内（如 FedStart 环境），防止 OAuth Token 被劫持或意外泄露。
- **Scope 聚合**：区分了从 Console API 生成 Key 的权限 (`org:create_api_key`) 以及普通 Claude.ai 订阅者的全量权限（涵盖会话、文件上传与 MCP 桥接）。

### 3. API 与物理边界保护 (`apiLimits.ts`)
该模块定义了所有必须在**客户端侧进行前置拦截**的物理限制（防止直接将不合规负载抛给远端导致无意义的重试或错误）：
- **图像**：最高 `5MB` Base64 编码限制（回推原始图片约 3.75MB），以及客户端 Resize 操作的最大尺寸界定（`2000px`）。
- **PDF 与媒体**：定义了单次最高 `100` 个页面的限制、`20MB` 原始文件容量、以及 `3MB` PDF 抽取阈值（决定是走 Base64 Document Block 还是降级拆分为图像）。
- **多媒体请求并发**：最多一次请求携带 `100` 个混合 Media Item。

### 4. 工具隔离层与沙箱管控 (`tools.ts`)
并不是所有的 Agent 都可以使用全量工具，这由本模块预配置的安全组决定：
- **异步探员 (`ASYNC_AGENT_ALLOWED_TOOLS`)**：允许执行文件读写、Grep、Shell 等重型工具，但被严格禁止调用产生递归的工具（如 `AgentTool`，防止无限子代增殖）。
- **协调者 (`COORDINATOR_MODE_ALLOWED_TOOLS`)**：只保留对探员的管理权与输出权（如 `TaskStop`，`Agent`），从而保证架构分层，主循环不做脏活。

### 5. 遥测与指纹 (`system.ts`)
- **计费与流量追踪**：`getAttributionHeader` 生成 `x-anthropic-billing-header`。
- **Native 证明 (Attestation)**：如果是本地编译版，还会注入 `cch=00000` 占位符，由底层 C/Zig/Rust 网络库实时替换为哈希摘要，向服务端自证这是一次合法的终端 CLI 访问。

## 维护规范

1. **零依赖原则**：所有被提取进 `constants` 的文件必须保持最精简的依赖树。**绝对禁止**从 `src/constants/` 去引用 `src/tools/` 内部的运行时业务逻辑（仅允许引用 Prompt 字符串或 Type），否则会导致底层的严重循环依赖（Circular Dependencies）。
2. **缓存破坏警告**：修改 `prompts.ts` 中的静态常量文案时（如代码审查指导、回答精简要求），务必确认该文案是全局通用还是只针对某些特定测试（如果针对特定测试，需写在 Dynamic Boundary 之后）。
