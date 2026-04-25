# src/tools — 智能体工具与技能生态系统模块
> 参见 [README.md](../../README.md)

## 简介
本模块负责提供和管理供 AI 智能体调用的所有外部环境交互工具及辅助技能。其核心机制是通过封装各自独立的工具实现（如终端执行、文件读写、网页浏览等），并利用统一的工具消息解析与响应结构与智能体会话生命周期对接。本模块直接服务于业务逻辑层，为各种智能体（单体或多智能体集群）赋能，使其具备跨系统执行命令和读写状态的实际操作能力。

## 目录结构
```text
src/tools/
├── AgentTool/                # 智能体协同与派生控制工具
├── AskUserQuestionTool/      # 提示用户补充信息或进行确认工具
├── BashTool/                 # 终端命令执行与沙箱控制工具（含严格的安全边界校验）
├── BriefTool/                # 简报与核心状态总结工具
├── ConfigTool/               # 系统与用户配置管理工具
├── DiscoverSkillsTool/       # 技能自动发现与检索工具
├── EnterPlanModeTool/        # 激活进入长期规划模式工具
├── EnterWorktreeTool/        # 进入 Git Worktree 隔离开发环境工具
├── ExitPlanModeTool/         # 退出长期规划模式工具
├── ExitWorktreeTool/         # 退出 Git Worktree 隔离开发环境工具
├── FileEditTool/             # 单文件内容编辑与替换工具
├── FileReadTool/             # 文件内容读取与分析工具
├── FileWriteTool/            # 新文件写入或全量覆盖工具
├── GlobTool/                 # 模式匹配与批量文件查找工具
├── GrepTool/                 # 基于正则与文本模式的代码检索工具
├── LSPTool/                  # 语言服务器协议对接与代码洞察工具
├── ListMcpResourcesTool/     # 获取可用 MCP 协议资源列表工具
├── MCPTool/                  # MCP 协议服务调用基础工具
├── McpAuthTool/              # MCP 资源与服务身份鉴权工具
├── MonitorTool/              # 系统指标与后台进程监控工具
├── NotebookEditTool/         # Jupyter Notebook 等文件编辑工具
├── OverflowTestTool/         # 用于上下文超载测试与异常模拟工具
├── PowerShellTool/           # PowerShell 专属命令行执行工具
├── README.md                 # 模块说明文档
├── REPLTool/                 # 交互式代码执行环境（REPL）工具
├── ReadMcpResourceTool/      # 读取与加载 MCP 协议资源内容工具
├── RemoteTriggerTool/        # 跨设备或跨集群的远程触发执行工具
├── ReviewArtifactTool/       # 代码制品检查与质量评估工具
├── ScheduleCronTool/         # 定时任务配置与 Cron 调度控制工具
├── SendMessageTool/          # 发送异步消息或外部通知工具
├── SendUserFileTool/         # 提取文件并向用户端发送呈现工具
├── SkillTool/                # 执行特定的原子化业务技能工具
├── SleepTool/                # 挂起与延时等待工具
├── SnipTool/                 # 代码片段提取与剪裁工具
├── SyntheticOutputTool/      # 生成合成测试数据与模拟输出工具
├── TaskCreateTool/           # 异步任务或子任务创建与登记工具
├── TaskGetTool/              # 查询指定任务状态与详情工具
├── TaskListTool/             # 批量查询与列举当前活跃任务工具
├── TaskOutputTool/           # 获取或附加任务执行输出内容工具
├── TaskStopTool/             # 强制终止或挂起活跃任务工具
├── TaskUpdateTool/           # 更新任务进度状态与关联数据工具
├── TeamCreateTool/           # 创建多智能体协作小队或工作组工具
├── TeamDeleteTool/           # 解散智能体团队并释放对应资源工具
├── TerminalCaptureTool/      # 终端屏幕内容捕获与字符流录制工具
├── TodoWriteTool/            # 记录待办事项与任务检查单工具
├── ToolSearchTool/           # 系统可用工具模糊查询与定位工具
├── TungstenTool/             # 钨丝（Tungsten）引擎专属控制适配工具
├── VerifyPlanExecutionTool/  # 校验长期规划执行状态与一致性工具
├── WebBrowserTool/           # 基于真实内核的网页浏览与DOM交互工具
├── WebFetchTool/             # 网页纯文本获取与轻量化请求工具
├── WebSearchTool/            # 搜索引擎接口调用与数据汇聚工具
├── WorkflowTool/             # 固定自动化工作流装配与执行工具
├── shared/                   # 工具间共享逻辑（如 Git 状态追踪、多智能体拉起机制）
├── testing/                  # 工具层的自动化测试基础设施与 Mock 数据
└── utils.ts                  # 工具消息标识符注入与状态提取公共函数
```

## 实现逻辑
### 1. 独立工具的封装与执行机制
模块内绝大多数功能被拆分为独立的子目录（如 `BashTool`、`GlobTool` 等）。每个工具目录内部高度内聚，通常负责处理其自身所需的参数校验、与底层基础设施（文件系统、终端、浏览器进程）的对接，以及工具结果的渲染（返回给智能体的消息与前端 UI 组件）。这种设计隔离了不同技能的实现细节，防止工具间逻辑耦合。

### 2. 工具调用的状态追踪与绑定
通过入口 `utils.ts` 的 `tagMessagesWithToolUseID` 与 `getToolUseIDFromParentMessage`，将用户消息与特定工具的调用 ID（Tool Use ID）进行绑定。这种机制用于确保会话中工具状态的一致性，使得 UI 层和逻辑层能够准确跟踪一个工具是处于运行中、已完成还是发生异常，同时避免状态的重复渲染。

### 3. 共享机制与协同编排
`shared/` 目录中包含跨工具共享的高阶能力（如多智能体生成 `spawnMultiAgent.ts` 以及版本控制追踪 `gitOperationTracking.ts`）。这些共享逻辑不依附于单一工具，而是为复杂的宏观技能（如代码重构、长期规划）提供跨系统操作的状态记忆与调度支持。

## 新增 / 重构 / 删除向导
### 新增
增加新工具时，请在 `src/tools/` 下新建以 `Tool` 结尾的目录，遵循单一职责原则实现其参数校验、执行逻辑和（如果适用）渲染组件；请将新工具注册到智能体上下文的可用工具列表中，并同步在 `testing/` 目录下补充完整的单元与边界测试。

### 重构
修改现有工具的入参结构或执行逻辑时，请务必保证对过去会话中已记录的工具消息具有向后兼容性（Backward Compatibility）；若涉及高风险工具（如 `BashTool` 的沙箱机制或安全过滤），请显式验证其故障安全（Fail-safe）策略是否生效，严防越权操作。

### 删除
弃用某个工具时，请先确保没有任何活跃的智能体或系统配置将其作为依赖；移除对应目录后，请追溯并清除智能体初始化时该工具的注册记录，并在解析器中添加兼容性处理逻辑，以防历史消息渲染崩溃。
