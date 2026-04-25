# src/services — 核心业务层与外部系统集成设施

> 参见 [README.md](../../README.md)
> 相关模块：
> - [src/utils](../utils/README.md) 提供系统全局共用的底层基础函数支持。
> - [src/bootstrap](../bootstrap/README.md) 在生命周期初始化时启动本目录内的多项后台服务。

## 简介

本模块负责统筹应用的非 UI 侧核心业务逻辑以及与各类外部设施的通信集成。其核心机制包括基于事件和轮询的资源配额监测（如速率限制与 Token 统计）、通过子进程或流式 WebSocket 桥接原生系统能力（如语音、唤醒保护），以及通过模块化的客户端对接外部平台协议（如 MCP 协议、语言服务器 LSP、OAuth）。本模块作为中间件基础设施，直接为命令处理层和交互渲染层提供稳定的能力支撑。

## 目录结构

```text
src/services/
├── AgentSummary/             # 代理会话执行总结生成服务
├── MagicDocs/                # 动态文档管理与呈现服务
├── PromptSuggestion/         # 命令行提示词自动补全建议服务
├── SessionMemory/            # 跨会话长时记忆存储与检索服务
├── analytics/                # 全局遥测与用户行为打点上报机制
├── api/                      # 业务侧接口的封装调用代理
├── autoDream/                # 空闲状态下的后台主动推演与思考进程
├── compact/                  # 提示词上下文容量超出时的压缩裁剪引擎
├── contextCollapse/          # 上下文窗口智能折叠防超载机制
├── extractMemories/          # 异步从对话历史中抽提关键信息存储
├── lsp/                      # Language Server Protocol 客户端集成与诊断通信
├── mcp/                      # Model Context Protocol 协议客户端、通信与生命周期管理
├── oauth/                    # 浏览器端 OAuth 鉴权及 Token 轮换逻辑
├── plugins/                  # 运行时插件加载与生命周期管理
├── policyLimits/             # 企业或组织维度策略限制规则验证
├── remoteManagedSettings/    # 服务端统一下发配置项拉取与热更新
├── sessionTranscript/        # 对话流水日志的全量落盘保存
├── settingsSync/             # 多端应用偏好设置数据同步服务
├── skillSearch/              # 自定义技能资源的检索与元数据提取
├── teamMemorySync/           # 团队级共享记忆池的云端同步集成
├── tips/                     # 场景化 CLI 引导与使用提示下发服务
├── toolUseSummary/           # 工具调用链统计分析与输出摘要
├── tools/                    # 基础系统级操作代理（文件、执行环境等）
├── awaySummary.ts            # 用户挂机返回时的状态快速总结逻辑
├── claudeAiLimits.ts         # 速率和调用限额的主状态管理与事件中心
├── claudeAiLimitsHook.ts     # 限额状态映射到 React 的钩子（Hook）
├── diagnosticTracking.ts     # IDE 或 LSP 输出的诊断/错误追踪分析
├── internalLogging.ts        # 针对服务的内部状态自记录机制
├── mcpServerApproval.tsx     # MCP 服务器接入前置授权确认 UI 组件
├── mockRateLimits.ts         # 测试环境下的流控阈值模拟器
├── notifier.ts               # 操作系统的系统级桌面通知分发
├── preventSleep.ts           # macOS 系统防休眠保活机制（caffeinate 包装）
├── rateLimitMessages.ts      # 触发限流时的标准化错误文本字典
├── rateLimitMocking.ts       # 限流切面逻辑拦截代理层
├── tokenEstimation.ts        # 本地预测 Bedrock/Anthropic 提示词成本和算力开销
├── vcr.ts                    # 回放与录制（VCR）模式的会话网络拦截器
├── voice.ts                  # 原生录音桥接与降级适配器（cpal/sox）
├── voiceKeyterms.ts          # 提高 STT（语音转文本）准确度的专业词汇词典
└── voiceStreamSTT.ts         # 基于 WebSocket 的 Anthropic 流式语音识别客户端
```

## 实现逻辑

### 1. 配额感知与用量流控
入口文件为 `claudeAiLimits.ts` 和 `tokenEstimation.ts`。本模块通过内部轮询以及 API 响应头截获，在 `claudeAiLimits.ts` 中维护一个全局状态存储和订阅模型。前端交互层可以通过 `claudeAiLimitsHook.ts` 监听该状态以实时预警超发。为了避免因配额过度消耗导致服务拒绝，`tokenEstimation.ts` 结合相关计费规则在提交请求前进行资源估算机制。为保证测试安全，`mockRateLimits.ts` 通过切面（Aspect）对开发环境中的网络层进行无侵入的限制拦截。

### 2. 外部系统扩展协议桥接
本模块作为与第三方协议交互的门户。`mcp/` 目录实现了 Model Context Protocol，支持挂载第三方 MCP 服务器处理扩展逻辑。`lsp/` 目录对接 Language Server 的输入，并借由 `diagnosticTracking.ts` 将其统一标准化（Normalization）供大语言模型消费，此设计在保障核心功能独立性的同时允许能力泛化。`oauth/` 则分离了授权流，隔离了长期会话令牌的风险。关键约束是所有接入协议（包含 MCP）必须要通过 `mcpServerApproval.tsx` 及其配套鉴权链条完成用户态授权，防止高危沙箱溢出。

### 3. 原生能力聚合
依靠 `voice.ts` 与 `voiceStreamSTT.ts` 两者的配合，在独立子进程（Child Process）中使用 `cpal` 或 `sox` 录制音频流，并建立长连接直接与语音推断引擎通讯。配合 `preventSleep.ts` 的 `caffeinate` 衍生进程绑定，保证了在此长周期 I/O 等待时系统不被降频或休眠。这些机制多处采用流式（Streaming）接口，且自带异常重试与悬挂进程（Zombie Process）兜底清理策略。

### 4. 记忆与上下文管理机制
通过组合 `SessionMemory/`、`contextCollapse/` 和 `extractMemories/` 形成了应用运行时的上下文闭环。本模块监测本地会话状态，并在判定负载溢出时主动进行上下文脱水（Dehydration）与裁剪；并在特定生命周期内触发 `autoDream/` 进行空闲思考预测，从而提供下一轮交互的前置预热。

## 新增 / 重构 / 删除向导

### 新增
添加新的后台服务或集成点时，请在 `src/services/` 内新建对应功能独立目录并暴露主要入口文件。若包含系统强交互行为（如调用底层 API 或外接新服务网络请求），必须在单元测试中增加 Mock 隔离策略，禁止真实外部网络请求被带入 CI/CD 构建环节。若涉及授权或计费行为，须接入现存的 OAuth 或 Token 分析链路。

### 重构
修改服务内部轮询周期、连接超时时长或外部鉴权流程时，须确保对消费端保持向后兼容或通过发布版本平滑过渡。鉴于本模块下存在多个容错兜底策略（如网络限速的安全失败（Fail-safe）熔断保护及设备降级机制），重构时必须显式保留这些容错逻辑，避免底座设施单点崩溃导致应用闪退。

### 删除
当废弃某一独立服务时，必须清理该目录下所有的测试桩件与持久化配置，并在全仓检索所有从本模块引入该服务实例的上游调用方，将其调用的业务逻辑点同步剥离。在移除带有长期连接的子模块前，必须保证相应的清理钩子（Graceful Shutdown）能被正常唤起。
