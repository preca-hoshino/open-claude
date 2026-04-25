# src/keybindings — 快捷键与上下文绑定模块
> 参见 [README.md](../../README.md)
> 关联 `src/ink`，本模块基于其事件系统进行按键拦截与封装。

## 简介
本模块在系统中负责管理与解析全局及特定上下文的快捷键绑定，并将终端按键事件映射为对应的操作动作（Action）。通过在 React 上下文层全局拦截输入（Chord Interceptor）并根据活跃上下文进行优先级匹配，本模块支持多键组合序列（Chord Sequences）并实现了按键冲突的安全隔离。本模块作为基础交互设施层，为上层业务界面提供统一的快捷键接口与配置热重载能力。

## 目录结构
```text
├── KeybindingContext.tsx # 快捷键 React 上下文提供者，管理激活的上下文集合与组件绑定的处理函数
├── KeybindingProviderSetup.tsx # 全局拦截器配置与提供者组装，监听并拦截所有按键以支持组合键
├── defaultBindings.ts # 预设的各上下文默认快捷键绑定规则配置
├── loadUserBindings.ts # 用户自定义配置加载与合并，通过 chokidar 实现配置文件的热重载
├── match.ts # 输入事件匹配逻辑，将 Ink 输入对象与解析后的按键定义进行多维度比对
├── parser.ts # 按键字符串解析器，将快捷键定义转换为标准化内部对象
├── reservedShortcuts.ts # 操作系统与终端系统级保留快捷键定义，用于阻止非法覆盖
├── resolver.ts # 快捷键路由分发逻辑，基于当前激活的上下文与输入序列计算命中的动作
├── schema.ts # 快捷键配置文件的 Zod 数据校验结构声明
├── shortcutFormat.ts # 快捷键展示文本格式化工具
├── template.ts # 默认快捷键配置模板生成工具
├── types.ts # 快捷键系统的核心类型定义
├── useKeybinding.ts # 组件消费的 React 钩子接口，用于在特定上下文中注册回调函数
├── useShortcutDisplay.ts # 快捷键提示文本渲染专用的 React 钩子接口
└── validate.ts # 自定义配置验证器，检测保留键冲突与重复绑定
```

## 实现逻辑
### 1. 全局按键拦截与组合键管理
入口为 `KeybindingProviderSetup.tsx` 中的 `ChordInterceptor` 组件。为了支持多键组合序列（Chord Sequences），本模块必须在其他组件处理按键前拦截事件。拦截器直接监听底层的输入流，根据当前的等待状态（Pending State）与激活的上下文层级计算匹配结果。如果命中组合键的起始阶段，系统会更新等待状态并调用事件中止方法（`event.stopImmediatePropagation()`）截断事件传播，防止中间态按键泄露到输入框中；若超时未完成则自动撤销状态。

### 2. 优先级路由与上下文栈
系统使用基于优先级的上下文解析（Context Priority Resolution）。所有的绑定动作都严格归属于特定的上下文标识（如 `Chat` 与 `ThemePicker` 定义于 `types.ts` 中的 `KeybindingContextName`）。通过 `KeybindingContext.tsx` 中的 `useRegisterKeybindingContext`，组件可以在挂载时声明其对应的上下文为活跃状态。当拦截器接收到按键时，`resolver.ts` 会按优先查找活跃上下文、最后回退至 `Global`（全局通用）的顺序查找匹配项，从而允许局部操作安全地覆盖全局快捷键，避免系统级按键冲突。

### 3. 用户配置热重载与安全合并
用户可通过配置文件自定义按键（由 `loadUserBindings.ts` 负责）。本模块对配置文件进行实时监听，在检测到变更时异步重新加载、执行 Zod 格式验证（`schema.ts`）与保留快捷键冲突检测（`validate.ts` 及 `reservedShortcuts.ts`）。如果用户配置通过验证，这些新规则将作为高优先级配置覆盖 `defaultBindings.ts` 中的系统预设，并通过 React 状态更新通知所有子组件重新渲染快捷键显示与回调映射。

## 新增 / 重构 / 删除向导
### 新增
- 必须在 `types.ts` 和 `schema.ts` 的 `KEYBINDING_CONTEXTS` 中同步注册新的上下文标识及对应的描述。
- 必须在 `schema.ts` 的 `KEYBINDING_ACTIONS` 中声明新的操作动作标识。
- 在 `defaultBindings.ts` 中配置默认的按键映射关系。
- 在对应业务组件中通过 `useKeybinding` 注册该动作的处理逻辑。
- 确保新增的组合键序列经过跨平台终端测试验证。

### 重构
- 严禁修改或绕过 `ChordInterceptor` 的事件截断机制（`stopImmediatePropagation`），以防终端输入字符泄漏至其他层。
- 必须确保原有的各种修饰符别名（如 `cmd`、`opt`、`super`）保持相同的向后兼容映射行为。
- 本模块的验证器包含故障敞口（Fail-open）策略：当用户配置文件发生解析错误或完全失效时，模块会自动降级回退至 `defaultBindings.ts`，确保应用的基础交互不受影响。重构时严禁移除此安全回退策略。

### 删除
- 彻底清除 `defaultBindings.ts` 以及 `schema.ts` 中废弃的操作或上下文声明。
- 必须追溯并屏蔽所有引用了废弃操作的 `useKeybinding` 上游调用方入口，防止出现无响应绑定。
- 仔细核查并移除所有遗留业务代码向被删除上下文注册事件的逻辑调用。
