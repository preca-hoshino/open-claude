# 助手与彩蛋模块 (`buddy`)

本模块负责实现 Open-Claude 中独具特色的 Companion（虚拟助手/精灵）功能。这是一个纯前端的 UI 与状态彩蛋，它寄宿于界面的右下角（或作为浮动组件），通过简单的状态联动为用户提供趣味性的交互体验。

## 核心实现逻辑

### 1. 精灵生成与数据结构 (`companion.ts` & `types.ts`)
Companion 的属性生成机制采用了确定性伪随机算法（PRNG），确保同一用户获得的精灵形态是稳定的。
- **Mulberry32 随机数生成**：基于 `hashString(userId)` 生成种子，通过 `mulberry32` 进行序列生成。
- **骨架系统 (Bones)**：生成的精灵包含种类（Species，如猫、鸭子、龙等）、稀有度（Rarity）、眼睛表情、帽子饰品以及偏置的四维属性（Stats）。
- **状态合并**：通过 `getCompanion()` 将随机生成的只读视觉骨架（Bones）与从持久化配置读取的灵魂状态（如名字）进行混合。

### 2. 视觉渲染与动画引擎 (`sprites.ts` & `CompanionSprite.tsx`)
这是一个高度精简的基于文本/ASCII的动画引擎。
- **帧与动作序列**：`sprites.ts` 内置了所有物种的 ASCII 字符画数组，通过 `IDLE_SEQUENCE` 实现了帧序列控制（如：静止、眨眼、躁动）。通过替换 `{E}` 占位符渲染不同的眼睛状态。
- **UI 组件层**：`CompanionSprite.tsx` 内置了一个以 `500ms` 为周期的 React 计时器（Tick），周期性驱动状态机流转。组件能够响应 `/buddy pet` 触发的爱心动画（`PET_HEARTS`），以及渲染来自后端的简短对话气泡（SpeechBubble）。

### 3. 模型侧提示词约束 (`prompt.ts`)
为了防止大模型混淆自身与 Companion 的身份，当用户提及 Companion 的名字时，系统会在当前轮次向模型附加特定的 `companion_intro` 附件。
- **角色隔离**：强制通过 System Prompt 告知大模型“你不是该助手”，要求大模型不要擅自代入 Companion 的语气进行长篇大论，把简短回复的权利留给 UI 侧的动画气泡。

### 4. 触发与通知器 (`useBuddyNotification.tsx`)
- 内置了一个基于日期的激活逻辑（Teaser Window），在特定时间窗口内通过 `useNotifications` 系统发送引导彩蛋。
- `findBuddyTriggerPositions` 通过正则解析用户的输入框文本，用以高亮 `/buddy` 指令或驱动其它隐藏逻辑。

## 维护规范

- **ASCII 对齐严格性**：在 `sprites.ts` 中新增任何物种或帽子时，必须严格遵守 12 字符宽度与 5 行高度的网格约束（`SPRITE_BODY_WIDTH`），破坏对齐会导致整个右侧栏界面发生抖动。
- **状态订阅的解耦**：Companion 的重渲染依赖 `useAppState` 中针对性的字段（如 `companionReaction`）。严禁在此引入高频更新字段（如 `mainLoopModel` 或键盘录入内容），避免造成不必要的全局帧率下降。
- **确定性保证**：修改 `companion.ts` 中的随机权重或池子时需注意向后兼容性。虽然骨架每次都会根据 ID 重算，但如果打乱了枚举值的顺序，可能导致用户的精灵无意中发生“突变”。
