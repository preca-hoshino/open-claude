# src/coordinator — 代理协调与并行调度模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/remote/`](../remote/README.md)（可能有远程通信涉及）或 [`src/query/`](../query/README.md)（协同查询）

## 简介

本模块用于支持高级的多代理协同（Multi-Agent Coordination）与分布式任务拆解执行架构。当系统面对复杂请求时，协调器能够将任务分配给不同的后台 Worker Agent 进行并行或流水线式处理，最后再将结果进行汇总整合。这代表了系统从“单体模型单兵作战”向“团队指挥调度”的范式演进。

## 目录结构

```text
coordinator/
├── __test__/                        # 协调器状态机与子代理通信逻辑的测试
├── coordinatorMode.ts               # 主协调器模式的控制逻辑，包含派发规则、System Prompt 与运行时限制
└── workerAgent.ts                   # 工作代理（子 Agent）的抽象与状态追踪
```

## 实现逻辑细节

### 1. 动态协调器注入 (Coordinator System Prompt)
`coordinatorMode.ts` 改变了大模型常规的扮演角色。一旦启用了 `COORDINATOR_MODE`，应用会注入一个极为详细的协调器专用 System Prompt（详见 `getCoordinatorSystemPrompt`）。在这个模式下，大模型不再亲自读写文件，而是通过一系列特权内部工具（如 `AgentTool`、`SendMessageTool` 和 `TaskStopTool`）像总指挥一样调度底层的 Worker 节点执行具体操作。

### 2. 工具权限降维与沙箱隔离 (Capability Isolation)
为了防止递归生成与权限滥用，协调器模式将主节点（Coordinator）和工作节点（Worker）的可用工具进行了严格区分。通过 `getCoordinatorUserContext`，Worker 节点被移除了如建立/删除团队（TeamCreate / TeamDelete）和合成输出（Synthetic Output）等元逻辑控制权限，只保留纯粹的工程工具（Bash、FileRead、FileEdit 等）以及外部引入的 MCP 服务。同时，协调器通过 `tengu_scratch` 开关向 Worker 暴露一个 Scratchpad 临时目录，用于进行代理间安全无阻的上下文资料交换。

### 3. XML 规范化的异步信号流 (Task Notifications)
在并行多开 Worker 后，协调器不会进行阻塞等待。当任何一个 Worker Agent 执行完毕（无论是成功 `completed`、执行失败 `failed` 还是被外力强杀 `killed`），系统都会构造一个标准的 `<task-notification>` 结构的 XML 消息插入到协调器的会话中枢。协调器通过解析这些带有 `<task-id>` 和 `<summary>` 的异步回传事件，决定是重构 Prompt 后通过 `SendMessage` 继续驱动该 Worker，还是开启全新的独立节点处理下一步。

## 新增 / 重构 / 删除向导

### 新增
- 若希望加入新的并行任务通信范式（例如增加一种新的 Worker 汇报结构或新增特权工具），请在 `coordinatorMode.ts` 的提示词逻辑中进行全量的文档更新，以确保模型理解新工具的用法。
- 必须在 `__test__` 中增加极端的并发条件和异常捕获用例，例如验证某个 Worker Agent 崩溃时协调器能否正确接收到 Error 报告并重试。

### 重构
- 更改 `matchSessionMode` 中关于 `CLAUDE_CODE_COORDINATOR_MODE` 环境变量翻转的逻辑时，请务必关注历史会话的恢复兼容性（Resumed Session），确保不会导致普通上下文错误地陷入 Coordinator 逻辑。

### 删除
- 如果项目改变产品方向，决定废除复杂的多 Agent 架构而回归单体串行 Agent，则可安全废弃本模块，并清理 `src/query/` 及入口处有关 Coordinator 模式的启动分支判别。
