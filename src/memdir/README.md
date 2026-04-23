# 记忆目录模块 (`memdir`)

本模块负责构建 Open-Claude 的持久化记忆系统，通过文件系统实现大模型（LLM）的长期上下文机制。该系统区分了 Private（个人）与 Team（团队）双重作用域，并深度集成了防注入保护、语义关联召回和生命周期管理。

## 核心实现逻辑

### 1. 记忆系统的分类学与架构 (`memoryTypes.ts` & `teamMemPrompts.ts`)
为了避免 LLM 滥用记忆系统（如将代码结构写入记忆），模块定义了四种严格的记忆分类，并生成对应的 System Prompt 指导大模型的存取行为：
- **`user`（用户偏好）**：仅限 Private，记录用户画像、习惯与知识背景。
- **`feedback`（反馈意见）**：记录用户纠正的错误或确认的决策，团队级惯例则提升至 Team 域。
- **`project`（项目上下文）**：项目死线、技术债背景等代码外的上下文（优先 Team 域）。
- **`reference`（外部引用）**：记录如 Linear 链接、Slack 频道等外部系统知识。

系统明确排除了可被直接检索的代码片段、Git 日志和调试过程。同时向 LLM 提供了明确的两步保存策略：创建带 Frontmatter 的 Markdown 实体文件，并在 `MEMORY.md` 索引文件中写入单行指针。

### 2. 检索与相关性召回 (`memoryScan.ts` & `findRelevantMemories.ts`)
- **文件扫描**：`scanMemoryFiles` 提供了一个优化的扫描器，仅读取 `.md` 文件的前 30 行（`FRONTMATTER_MAX_LINES`）以提取元数据和时间戳，并按时间降序截取前 200 个。
- **语义筛选**：`findRelevantMemories` 将扫描得到的 Manifest 提交给 Sonnet 模型，让模型基于当前用户的 Query 选出（最多 5 个）最相关的记忆文件。该过程内置了针对 `recentTools` 的去噪过滤（避免把正在使用的 Tool 的文档又捞取一遍）。

### 3. 生命周期与时效性控制 (`memdir.ts` & `memoryAge.ts`)
- **索引截断防御**：`truncateEntrypointContent` 限制了 `MEMORY.md` （常驻上下文区）的大小，强制截断超过 200 行或 25KB 的索引并追加警告，逼迫模型精简索引条目。
- **防过期毒化（Staleness Caveat）**：`memoryAge.ts` 为超过 1 天的记忆自动包裹 `<system-reminder>`，提醒模型这是历史快照（Point-in-time），在推荐前必须通过 `Grep` 等工具重新校验文件路径或函数的存在性，避免对已重构的代码做出错误断言。
- **KAIROS 日志追加模式**：当启用 KAIROS 助手特性时，提示词策略将切换至 Append-only 日志流（`YYYY-MM-DD.md`），将压缩归档的工作下放给夜间的 `/dream` 技能处理。

### 4. 路径遍历与符号链接安全 (`teamMemPaths.ts`)
作为大模型可写的本地文件系统接口，团队目录模块包含了深度的防御性编程设计（对抗 PSR M22186/M22187）：
- **深层 `realpath` 逃逸拦截**：不仅检查 `resolve()` 的字符串前缀，更使用 `realpathDeepestExisting` 逐级向上溯源，防止恶意创建悬空符号链接（Dangling Symlink）导致的写穿透（Write-out-of-bound）。
- **编码与正则化攻击防御**：拦截并校验了 URL 编码（`%2e%2e%2f`）和 Unicode 宽度正则化（如全角 `．．／` 经 NFKC 标准化后变为 `../` 的攻击向量）。

## 维护规范

- **安全红线**：禁止在未经 `validateTeamMemWritePath` 校验的情况下，将模型输出的文件路径直接交给 `fs.writeFile` 执行。
- **Context Token 预算**：修改 `memoryTypes.ts` 及其附属 Prompt 时必须极度克制。此处的每一个字节都会附着在主轮次的 System Prompt 中产生极高的长尾消耗。
- **同步 IO 限制**：在 `memdir.ts` 等直接支撑 Prompt 组装的地方，允许谨慎使用 `fs.readFileSync`（由于在 Node 环境下的单次轻量级配置读取），但对于所有大规模或目录级的遍历必须走异步（如 `memoryScan.ts`）。
