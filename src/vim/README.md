# src/vim — Vim 模式状态机与编辑操作核心

> 参见 [README.md](../../README.md)
> 相关模块：[src/hooks](../hooks) — `useVimInput` 是本模块的唯一上游调用方，负责将键盘事件驱动状态机并将操作结果回写至编辑器。

## 简介

本模块实现一个完整的 Vim 键序列解析状态机（State Machine），将原始键盘输入转译为光标移动（Motion）、操作符（Operator）与文本对象（Text Object）三类编辑指令，并以纯函数方式执行对文本与光标状态的变更。核心机制是有穷状态自动机（Finite State Automaton）：每次按键触发一次状态转换，状态节点携带足够上下文以保证对后续输入的无歧义消费。本模块服务于 `src/hooks` 层，作为编辑器键盘处理管道的纯计算内核。

## 目录结构

```text
src/vim/
├── types.ts         # 完整类型定义层：VimState、CommandState、PersistentState 及所有键集常量；同时提供初始状态工厂函数
├── motions.ts       # 光标移动纯函数：将按键与重复次数映射为目标 Cursor 位置，并声明 Inclusive/Linewise 属性
├── textObjects.ts   # 文本对象边界解析：按词、引号、括号类型定位 inner/around 范围，输出字节偏移区间
├── operators.ts     # 操作符执行层：基于 Motion、文本对象或行范围执行 delete/change/yank 及 x/r/~/J/p/o/>> 等派生指令
└── transitions.ts   # 状态转换表：实现主分发函数 transition()，每个状态类型对应一个转换函数，消费按键后返回下一状态或待执行副作用
```

## 实现逻辑 [分析]

### 1. 类型驱动的状态机骨架

本模块以 `types.ts` 为基础。`VimState` 是一个判别联合类型（Discriminated Union），区分 `INSERT`（追踪已输入文本以支持点重复）和 `NORMAL`（内嵌 `CommandState`）两种模式。`CommandState` 同样是判别联合，包含 `idle`、`count`、`operator`、`operatorCount`、`operatorFind`、`operatorTextObj`、`find`、`g`、`operatorG`、`replace`、`indent` 共 11 个节点，TypeScript 的穷举检查（Exhaustiveness Checking）确保 `transitions.ts` 中的 `switch` 覆盖全部合法状态。`PersistentState` 独立于 `VimState` 存储跨命令记忆：上次变更（`lastChange`）用于点重复（Dot-Repeat），上次字符查找（`lastFind`）用于 `;` / `,` 重复，寄存器（`register`）用于粘贴。常量 `MAX_VIM_COUNT = 10000` 是防止用户输入超大计数导致性能问题的安全上限。

### 2. 状态转换与输入分发

`transitions.ts` 中的 `transition(state, input, ctx)` 是状态机的唯一入口，依据 `state.type` 将按键分发至对应的转换函数。转换函数返回 `TransitionResult`：`next` 字段指定下一状态，`execute` 字段携带待执行的副作用闭包（供上游在提交状态前调用），两者均为可选——若返回空对象则表示忽略当前按键。`handleNormalInput` 和 `handleOperatorInput` 是两个共享处理函数，分别在 `idle`/`count` 态和各 `operator*` 态中复用，消除重复的按键映射代码。字符查找方向反转（`;` 正向，`,` 反向）在 `executeRepeatFind` 中通过翻转 `FindType`（`f↔F`，`t↔T`）实现。`r<BS>` 等特殊情况通过在 `fromReplace` 中检测空字符串输入并取消状态来处理，防止空字符替换当前字符。

### 3. 光标移动的纯函数模型

`motions.ts` 提供三个导出接口：`resolveMotion` 通过循环调用 `applySingleMotion` 实现计数重复，并在光标不再移动时（`equals` 检测）提前终止防止死循环；`isInclusiveMotion` 声明 `e`/`E`/`$` 等运动的末端字符包含语义（Inclusive）；`isLinewiseMotion` 声明 `j`/`k`/`G`/`gg` 的行级操作语义（Linewise）。这两个属性由 `operators.ts` 中的 `getOperatorRange` 读取，以正确计算操作范围边界。注释明确指出 `gj`/`gk` 属于字符级移动而非行级，与 Vim 原文档 `:help gj` 保持一致。

### 4. 操作符执行与范围计算

`operators.ts` 暴露一组执行函数，均接受 `OperatorContext` 接口作为副作用通道（setText、setOffset、enterInsert、setRegister、recordChange 等），与具体编辑器状态实现解耦，保持函数可测试性。核心私有函数 `getOperatorRange` 处理三类特殊情况：`cw`/`cW` 的语义修正（修改到词尾而非下一词首）、行级运动的范围扩展至完整行（含对文件末尾删除时前向吸收换行符的边界处理），以及图片引用占位符（`[Image #N]`）的整体覆盖（通过 `snapOutOfImageRef` 防止 `dw`/`cw` 留下残缺占位符）。`executeLineOp` 使用字节偏移计算当前逻辑行而非依赖 `cursor.getPosition()`，注释中明确指出后者返回的是视觉换行行号，不适用于行操作计数。

### 5. 文本对象边界定位

`textObjects.ts` 对外仅暴露 `findTextObject` 一个函数，内部按对象类型路由：`w` 词和 `W` WORD 类型通过 `findWordObject` 实现，该函数以字素（Grapheme）为最小单位分词，支持词字符（Word Character）、空白字符（Whitespace）和标点（Punctuation）三种字符类别的边界识别；引号类型（`"`/`'`/`` ` ``）通过 `findQuoteObject` 实现，采用奇偶配对（Even-Odd Pairing）策略（第 0-1 对、第 2-3 对……），以行为作用域防止跨行配对；括号类型通过 `findBracketObject` 实现，采用深度计数（Depth Counting）在嵌套括号中定位最近的封闭层。三种函数均支持 `isInner` 参数区分 `inner`（不含定界符）和 `around`（含定界符）语义。

## 新增 / 重构 / 删除向导

### 新增

- 新增运动类型时，在 `types.ts` 的 `SIMPLE_MOTIONS` 集合中注册键名，并在 `motions.ts` 的 `applySingleMotion` 中添加对应 `case` 分支；若该运动具有 Inclusive 或 Linewise 属性，同步更新 `isInclusiveMotion` 或 `isLinewiseMotion`。
- 新增操作符类型时，在 `types.ts` 的 `Operator` 类型和 `OPERATORS` 映射表中同步注册，并在 `operators.ts` 中实现对应执行函数；在 `applyOperator` 中添加对应的文本变更分支；在 `RecordedChange` 类型中新增对应变体以支持点重复（Dot-Repeat）。
- 新增文本对象类型时，在 `types.ts` 的 `TEXT_OBJ_TYPES` 集合中注册对象键，在 `textObjects.ts` 的 `findTextObject` 中添加路由分支并实现边界定位函数；同步在 `operators.ts` 的 `OperatorContext` 相关测试中覆盖新类型。
- 新增状态节点时，在 `types.ts` 的 `CommandState` 判别联合中添加新变体，并在 `transitions.ts` 的 `transition` 主 `switch` 中添加对应的转换函数条目，确保 TypeScript 穷举检查通过。
- 为任何新增功能在 `__test__/` 目录中补充相应的单元测试。

### 重构

- 保持 `OperatorContext` 接口的方法签名向后兼容（Backward Compatible）；`useVimInput` 作为唯一实现方，任何接口变更须同步更新调用方。
- `getOperatorRange` 中对 `cw`/`cW` 的特殊处理和图片占位符对齐逻辑属于有意为之的安全策略，重构时须保留并在注释中说明意图，防止被误认为是冗余逻辑而删除。
- `MAX_VIM_COUNT` 是防止超大计数引发性能问题的安全上限（Fail-safe），修改该值前须评估对 `operatorCount` 状态下计数累积逻辑的影响。
- 所有运动和操作符均为纯函数，重构时须维持无副作用约束，副作用仅通过 `OperatorContext` 回调注入。

### 删除

- 下线某个运动类型前，从 `types.ts` 的 `SIMPLE_MOTIONS`、`FIND_KEYS` 或相关常量集合中移除，同步删除 `motions.ts` 中对应的 `case` 分支和属性判断逻辑。
- 下线某个操作符前，从 `types.ts` 的 `Operator` 类型和 `OPERATORS` 映射中删除，清理 `operators.ts` 中的执行函数和 `applyOperator` 分支，并从 `RecordedChange` 类型中移除对应变体。
- 删除任何导出接口前，追溯并屏蔽 `src/hooks/useVimInput.ts` 中所有对该接口的调用点，确认无残留引用后再执行删除。
- 删除状态节点前，从 `types.ts` 的 `CommandState` 中移除变体，同步删除 `transitions.ts` 中对应的转换函数，并确认 TypeScript 编译无穷举报错。
