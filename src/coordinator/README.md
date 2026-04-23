# src/coordinator — 代理协调与并行调度模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/remote/`](../remote/README.md)（涉及远程通信与代理分发）及 [`src/query/`](../query/README.md)（关联单节点的查询生命周期）

## 简介

本模块构成了系统高级多代理协同架构（Multi-Agent Coordination）与分布式任务执行管线的核心。在应对高复杂度工程任务时，协调器能够将主线目标降维分解，并异步派发给不同的后台工作代理（Worker Agent）执行并行化运算或流水线构建，最终收敛聚合输出。此架构标志着系统由传统的单体串行推断模型向集群式的分布式代理调度范式转型。

## 目录结构

```text
coordinator/
├── __test__/                        # 协调器状态机与代理间异步通信逻辑的测试集
├── coordinatorMode.ts               # 主调度节点控制层，管理任务分派协议、系统指令动态注入与权限沙箱边界
└── workerAgent.ts                   # 工作节点的实体抽象与状态溯源追踪
```

## 实现逻辑分析

### 1. 动态协调器状态空间注入 (Coordinator System Prompt)
`coordinatorMode.ts` 的核心机制在于大模型执行上下文的重塑。当系统环境启用 `COORDINATOR_MODE` 后，应用将向主节点注入一个结构严密的特定指令集（System Prompt，由 `getCoordinatorSystemPrompt` 维护）。在该模式的约束下，大模型退出文件级代码编辑角色，转而通过一组高权限内部工具原语（包括 `AgentTool`、`SendMessageTool` 和 `TaskStopTool`）构建拓扑结构，作为总调度引擎异步驱动下层 Worker 节点实施具体的工程操作。

### 2. 工具集权限降级与沙箱执行域 (Capability Isolation)
为规避多层嵌套派发过程中的死锁风险与权限放大（Privilege Escalation），协调器对自身（Coordinator）和工作节点（Worker）持有的合法工具集进行了严格的边界划分。通过 `getCoordinatorUserContext` 接口的动态过滤，Worker 节点被剥离了涉及团队生命周期管理（TeamCreate / TeamDelete）和虚拟输出合成（Synthetic Output）等高级系统抽象控制权限，强制约束其仅拥有基础工程工具（如文件操作接口与 Bash 终端）以及授权引入的外部 MCP 端点。同时，协调器通过 `tengu_scratch` 配置位为子节点挂载一个受控的持久化暂存目录（Scratchpad），以支撑不同 Agent 之间的隔离式异步数据共享。

### 3. 基于 XML 语法的异步事件聚合 (Task Notifications)
针对并发拉起 Worker 节点的场景，主调度器摒弃了传统的同步阻塞（Blocking Wait）机制。当子级 Worker Agent 进入终态（涵盖任务成功 `completed`、执行异常 `failed` 或外部抢占中断 `killed` 状态）时，系统底层引擎会封装一个基于标准的 `<task-notification>` XML 标记流结构异步推入主调度器的事件队列中。协调器通过反序列化包含任务指纹（`<task-id>`）与执行摘要（`<summary>`）的回调数据报，据此评估是重构当前指令并通过 `SendMessage` 复用存量上下文推进执行链，还是启动独立的全新执行节点接管容错流程。

## 维护规范

### 新增规则
- 当系统拟引入新型的并行计算通信拓扑（例如支持 P2P 的 Worker 数据流或新增权限工具链）时，须首先在 `coordinatorMode.ts` 内详尽更新系统提示词逻辑，确保模型具备针对新接口的调用推理能力。
- 新增功能强制要求在 `__test__` 中补充覆盖高频并发场景及非预期状态转换的测试集合，例如验证某个 Worker Agent 发生资源耗尽型崩溃时，协调器是否能够稳定解析故障探针并执行容灾策略。

### 重构规则
- 若需修改 `matchSessionMode` 函数中针对 `CLAUDE_CODE_COORDINATOR_MODE` 环境变量流转的底层逻辑，须充分验证与历史休眠会话挂载机制（Resumed Session）的兼容性，严防普通会话实例（Normal Session）被错误路由至调度器执行平面。

### 废弃规则
- 若业务迭代需求将系统模型退化至轻量级的单体串行架构，开发团队可安全剥离并废除该模块实体。清理操作需伴随消除位于 `src/query/` 的协同逻辑桩块，以及系统自举入口处关于 Coordinator 模式判别参数的分支逻辑。
