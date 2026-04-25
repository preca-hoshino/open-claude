# src/assistant — 助手会话模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/remote/README.md`](../remote/README.md)（会话层）

## 简介

Assistant 模块主要承载智能助手会话相关的核心前端和逻辑代码，包括会话生命周期管理、历史记录管理以及会话选择界面。它是连接底层 API 请求与上层交互的关键枢纽。

## 目录结构

```text
assistant/
├── index.ts                         # 模块统一导出入口
├── gate.ts                          # 权限或网关拦截逻辑
├── sessionDiscovery.ts              # 会话发现机制，定位和恢复可用会话
├── sessionHistory.ts                # 会话历史记录的持久化和读取
├── AssistantSessionChooser.tsx      # React 终端组件：交互式选择会话
└── __tests__/                       # 测试目录
    └── ...
```

## 实现逻辑

### 历史检索与管理
`sessionHistory.ts` 负责对助手对话进行归档和存取，以保证在终端重新启动或出现崩溃后，用户能够通过 ID 寻址恢复先前的上下文语境。

### 终端交互发现
`sessionDiscovery.ts` 结合 `AssistantSessionChooser.tsx`，在交互式命令行界面（CLI / Ink）中向用户呈现可重连的会话列表，实现了对历史资产的有效管理和激活。

### 请求控制门闸
`gate.ts` 用于处理会话的前置约束（如鉴权检查、功能开关等）。它拦截并验证所有的助手初始化请求，确保只有合法上下文才能建立连接。

## 新增 / 重构 / 删除向导

### 新增
- 添加会话界面的新能力（如批量管理历史）时，需同步修改历史存取方法，并在 `AssistantSessionChooser.tsx` 中增加交互组件。
- 请补充针对 `__tests__` 的全量 UI 渲染测试（使用 Ink 测试库）。

### 重构
- 任何重构持久化结构（如改变会话文件的序列化方式）的行为，都必须提供对旧版存储结构的向前兼容迁移逻辑。

### 删除
- 删除过期交互逻辑前，必须确保终端用户侧的导航路径不再挂载对应的命令触发点。
