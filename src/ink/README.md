# src/ink — 终端 UI 渲染引擎与 React 宿主环境

> 参见 [README.md](../../README.md)
>
> 相关模块：[src/entrypoints](../entrypoints/README.md)——通过 `render()` 实例化本模块并挂载 React 树；[src/native-ts/yoga-layout](../native-ts/yoga-layout/README.md)——提供本模块布局计算所依赖的 Yoga 引擎实现。

## 简介

本模块实现面向终端的 React 自定义渲染器，将 React 组件树翻译为终端字节序列并输出到 stdout。其核心机制是双缓冲屏幕模型（Double-Buffering Screen Model）：每帧在后缓冲区绘制完整的字符矩阵，再与前缓冲区做差分（Diff）后仅写入变化单元格，以最小化终端写入字节数并消除全屏闪烁（Flicker）。本模块服务于顶层入口层，是整个应用唯一的终端输出基础设施。

## 目录结构

```text
src/ink/
├── ink.tsx                      # Ink 类：渲染会话主控，持有双缓冲、选区、鼠标状态等生命周期
├── reconciler.ts                # React Reconciler 宿主配置，桥接 Fiber 提交与 DOM 树变更
├── dom.ts                       # 虚拟 DOM 节点定义与操作（createNode、markDirty、scheduleRenderFrom）
├── renderer.ts                  # 帧渲染器工厂，将 DOM 树经 Yoga 布局后写入 Screen 对象
├── render-node-to-output.ts     # 递归遍历 DOM 节点并向 Output 写入单元格（含滚动、裁剪）
├── render-to-screen.ts          # 将 Output 转换为 Screen，提供位置高亮叠加
├── log-update.ts                # 差分引擎：比对前后帧 Screen 生成最小 Diff 序列
├── optimizer.ts                 # 对 Diff 序列做合并优化，减少终端写入次数
├── screen.ts                    # Screen 数据结构：紧凑 Int32Array 单元格存储、StylePool、CharPool
├── output.ts                    # Output 缓冲区：接收渲染指令并写入 Screen
├── frame.ts                     # Frame 类型定义：封装 Screen + 游标 + 视口 + 滚动提示
├── dom.ts                       # （见上）
├── focus.ts                     # FocusManager：焦点栈管理与 Tab 次序遍历
├── selection.ts                 # 文本选区状态机（仅全屏模式），支持鼠标拖拽与键盘扩展
├── searchHighlight.ts           # 搜索高亮叠加：在 Screen 上反色标注所有匹配单元格
├── hit-test.ts                  # 鼠标命中检测：将屏幕坐标映射到 DOM 节点并派发 click/hover
├── colorize.ts                  # ANSI 颜色工具：将 React 样式属性转换为 SGR 代码序列
├── styles.ts                    # Yoga 样式映射：将组件 style prop 应用到 LayoutNode
├── parse-keypress.ts            # 终端原始字节流解码器，识别 Kitty/xterm 扩展按键序列
├── Ansi.tsx                     # ANSI 字符串解析与宽度计算的底层工具集
├── bidi.ts                      # Unicode 双向文本（BiDi）方向判断
├── clearTerminal.ts             # 生成清屏序列（全屏重置路径）
├── constants.ts                 # 模块级常量（帧间隔 FRAME_INTERVAL_MS 等）
├── cursor.ts                    # 游标显隐控制序列常量
├── devtools.ts                  # React DevTools 桥接（仅开发模式加载）
├── get-max-width.ts             # 计算节点最大可用宽度的辅助函数
├── global.ts                    # 进程级全局标志初始化
├── instances.ts                 # Ink 实例注册表，支持按 stdout 查找已有实例
├── line-width-cache.ts          # 行宽缓存，避免重复调用 stringWidth
├── measure-element.ts           # 测量 DOM 节点布局尺寸的公共 API
├── measure-text.ts              # 文本测量：计算多行字符串的像素宽高（终端列/行单位）
├── node-cache.ts                # 节点矩形缓存：记录每个 DOM 节点上一帧的屏幕坐标
├── root.ts                      # 顶层根节点生命周期管理（render / unmount）
├── squash-text-nodes.ts         # 将相邻文本节点合并为单一字符串
├── stringWidth.ts               # Unicode 字形（Grapheme Cluster）感知的字符串列宽计算
├── supports-hyperlinks.ts       # 运行时检测终端是否支持 OSC 8 超链接
├── tabstops.ts                  # Tab 字符展开（列对齐）工具
├── terminal-focus-state.ts      # 终端窗口焦点状态跟踪（DEC ?1004h 模式）
├── terminal-querier.ts          # 终端能力查询：前景色、背景色、字体指标等
├── terminal.ts                  # Terminal 接口与原始字节写入、能力探测
├── termio.ts                    # termio 子模块统一出口
├── useTerminalNotification.ts   # TerminalWriteProvider：向 React 组件暴露终端写入通道
├── warn.ts                      # 开发期警告辅助（非整数尺寸等）
├── widest-line.ts               # 多行字符串中最宽行宽度计算
├── wrap-text.ts                 # 文本自动换行（按终端列宽）
├── wrapAnsi.ts                  # strip-ansi-aware 换行封装
│
├── components/                  # 内置 React 组件集（Box、Text、ScrollBox 等核心布局/内容原语）
│   ├── App.tsx                  # 顶层组件：鼠标/键盘事件分发与全局 UI 上下文
│   ├── AlternateScreen.tsx      # 全屏模式（xterm ?1049h）切换与生命周期管理
│   ├── Box.tsx                  # Flexbox 容器，映射 CSS Flex 属性到 Yoga
│   ├── Text.tsx                 # 文本节点，支持颜色、粗细、斜体等 SGR 属性
│   ├── ScrollBox.tsx            # 带虚拟滚动与鼠标滚轮支持的可滚动容器
│   ├── Button.tsx               # 可聚焦的交互按钮组件
│   ├── Link.tsx                 # OSC 8 超链接渲染组件
│   ├── RawAnsi.tsx              # 直接嵌入预渲染 ANSI 字符串的透明容器
│   ├── ErrorOverview.tsx        # 运行时错误边界与展示组件
│   ├── NoSelect.tsx             # 标记不参与文本选区的区域（行号、差异标记等）
│   ├── AppContext.ts            # 全局 App 上下文类型定义
│   ├── ClockContext.tsx         # 帧时钟上下文（动画、计时器同步）
│   ├── CursorDeclarationContext.ts  # 原生光标定位声明上下文
│   ├── StdinContext.ts          # stdin 流上下文
│   ├── TerminalFocusContext.tsx # 终端窗口焦点事件上下文
│   ├── TerminalSizeContext.tsx  # 终端尺寸（列×行）上下文
│   ├── Newline.tsx              # 显式换行符组件
│   └── Spacer.tsx               # 弹性空白填充组件
│
├── hooks/                       # 内置 React Hook 集
│   ├── use-input.ts             # 订阅键盘输入事件
│   ├── use-selection.ts         # 读写文本选区状态
│   ├── use-search-highlight.ts  # 控制搜索高亮查询字符串
│   ├── use-declared-cursor.ts   # 声明原生终端光标位置（CJK 输入法支持）
│   ├── use-terminal-viewport.ts # 读取终端尺寸与视口变化
│   ├── use-terminal-focus.ts    # 订阅终端窗口焦点事件
│   ├── use-terminal-title.ts    # 设置终端标题栏文字
│   ├── use-tab-status.ts        # 设置 iTerm2/WezTerm 标签页状态指示
│   ├── use-animation-frame.ts   # requestAnimationFrame 等价的帧回调 Hook
│   ├── use-app.ts               # 访问 App 上下文（exit、onFrameRendered 等）
│   ├── use-interval.ts          # 基于帧时钟的定时器 Hook
│   └── use-stdin.ts             # 访问 stdin 流
│
├── events/                      # 终端事件系统（捕获/冒泡两阶段派发）
│   ├── dispatcher.ts            # Dispatcher 类：与 React Reconciler 优先级集成的事件派发器
│   ├── terminal-event.ts        # TerminalEvent 基类：target、phase、propagation 控制
│   ├── keyboard-event.ts        # 键盘事件（keydown/keyup），携带解析后的 ParsedKey
│   ├── input-event.ts           # 文本输入事件，处理组合输入（IME）序列
│   ├── click-event.ts           # 鼠标点击事件，携带屏幕坐标
│   ├── focus-event.ts           # 焦点获得/失去事件
│   ├── paste-event.ts           # 括号粘贴（Bracketed Paste）事件
│   ├── resize-event.ts          # 终端尺寸变化事件
│   ├── terminal-focus-event.ts  # 终端窗口焦点变化事件
│   ├── event-handlers.ts        # 事件类型到处理器 prop 名称的映射表
│   ├── emitter.ts               # 简单事件发射器，供非 React 代码订阅事件
│   └── event.ts                 # 事件基础类型枚举
│
├── layout/                      # Yoga 布局引擎适配层（抽象接口 + 具体实现）
│   ├── node.ts                  # LayoutNode 接口定义与枚举（LayoutDisplay、LayoutMeasureMode 等）
│   ├── yoga.ts                  # YogaLayoutNode：将 LayoutNode 接口委托给 Yoga WASM 节点
│   ├── engine.ts                # createLayoutNode 工厂函数，统一节点创建入口
│   └── geometry.ts              # 几何基础类型（Point、Rectangle、Size）
│
└── termio/                      # 终端控制序列生成库
    ├── ansi.ts                  # 基础 ANSI 常量（ESC、BEL、SEP 等字节）
    ├── csi.ts                   # CSI 序列生成器（光标移动、擦除、滚动区域、Kitty 键盘协议）
    ├── dec.ts                   # DEC 私有模式序列（鼠标跟踪、备用屏幕、焦点报告）
    ├── esc.ts                   # ESC 单字节序列生成
    ├── osc.ts                   # OSC 序列（超链接、标题、剪贴板、iTerm2 扩展）
    ├── sgr.ts                   # SGR 颜色/属性序列生成（前景色、背景色、粗体等）
    ├── parser.ts                # 终端输入字节流解析器（VT 状态机）
    ├── tokenize.ts              # 将 ANSI 字符串拆分为可操作的令牌序列
    └── types.ts                 # termio 子模块共享类型定义
```

## 实现逻辑 [分析]

### 1. React Reconciler 与虚拟 DOM

本模块通过 `reconciler.ts` 实现 `react-reconciler` 宿主配置（Host Config），将 React 的 Fiber 提交阶段映射到自定义 DOM 操作。React 组件输出的 `<Box>`、`<Text>` 等原语被翻译为 `ink-box`、`ink-text` 等内部节点类型，最终构成以 `ink-root` 为根的 `DOMElement` 树。

`dom.ts` 定义节点结构并维护脏标记（Dirty Flag）：任何属性、样式或文本变更均调用 `markDirty()` 向上传播至根节点。脏标记是差分渲染的关键优化点——渲染器跳过整棵未变更子树的遍历（称为"Blit"优化），只对标记为脏的节点重新计算输出，将稳态帧的渲染代价压缩至 O(变更节点数)。

事件处理器通过 `_eventHandlers` 字段单独存储于节点上，与 `attributes` 隔离，从而避免每次处理器引用变化时触发脏标记、破坏 Blit 优化。

### 2. Yoga 布局与帧渲染管线

`layout/` 子模块封装 Yoga（Facebook Flexbox 引擎）的 TypeScript 移植版（`src/native-ts/yoga-layout`）。`createLayoutNode()` 工厂函数通过 `layout/engine.ts` 隔离具体实现，使布局层可在不修改上层代码的前提下切换引擎。

每次 React 提交后，`ink.tsx` 的 `onComputeLayout()` 回调以终端列宽作为约束宽度调用 `rootNode.yogaNode.calculateLayout()`，将 Flex 属性解算为每个节点的绝对像素偏移（终端的"像素"单位为字符列/行）。

`renderer.ts` 创建的渲染器函数随后将 DOM 树传入 `render-node-to-output.ts`，后者递归遍历节点并向 `Output` 对象写入字符单元格，`Output` 最终产出一个 `Screen` 对象（即当前帧的完整字符矩阵）。

### 3. 双缓冲差分与终端写入

`screen.ts` 中的 `Screen` 对象以紧凑 `Int32Array` 存储单元格：每个单元格占 2 个 `Int32`，第一个字为字符 ID（指向 `CharPool` 的字符串表），第二个字打包了样式 ID（17 位）、超链接 ID（15 位）、单元格宽度（2 位）。这一设计将 200×120 大小屏幕的内存从约 24,000 个 JS 对象压缩为单一 `ArrayBuffer`，并使差分比较降格为整数相等性检查。

`log-update.ts` 中的 `LogUpdate.render()` 接收前帧（Front Frame）和后帧（Back Frame），调用 `diffEach()` 逐单元格比对并生成 `Diff` 序列（仅包含变更位置的终端操作指令）。`optimizer.ts` 对 `Diff` 序列做合并，减少冗余的光标移动指令。最终差分结果经 `terminal.ts` 的 `writeDiffToTerminal()` 写入 stdout，对支持 DEC 2026 同步输出（Synchronized Output）的终端额外包裹 BSU/ESU 原子块以防止撕裂（Tearing）。

### 4. 全屏模式与选区叠加

当 `<AlternateScreen>` 组件挂载时，`ink.tsx` 进入全屏模式（Alt-Screen）：写入 `?1049h` 切换到备用屏幕缓冲区，启用鼠标跟踪（`ENABLE_MOUSE_TRACKING`），并将渲染高度硬性限定为终端行数以防止 Yoga 布局溢出导致光标模型失步。

文本选区（`selection.ts`）以独立状态机维护锚点（Anchor）和焦点（Focus）坐标，在每帧渲染后、差分计算前，`applySelectionOverlay()` 直接在 `Screen` 的单元格样式 ID 上叠加反色（SGR 7），无需更改 React 状态。叠加操作属于"有状态污染"（Contaminated Frame），`prevFrameContaminated` 标志确保下一帧触发全区域损伤（Full-Damage），使差分引擎强制清除残余反色单元格。

搜索高亮（`searchHighlight.ts`、`render-to-screen.ts`）采用相同的 Screen 叠加模式：`applySearchHighlight()` 对所有匹配单元格施加逆色，`applyPositionedHighlight()` 对当前位置额外叠加黄底加粗下划线。

### 5. 事件系统与输入解码

`termio/parser.ts` 实现 VT 状态机，将 stdin 字节流解析为结构化令牌。`parse-keypress.ts` 进一步识别 Kitty 键盘协议（CSI u）、xterm `modifyOtherKeys`（CSI >4m）及传统 VT 序列，输出 `ParsedKey` 结构体（含 `key`、`ctrl`、`shift`、`alt` 等字段）。

`events/dispatcher.ts` 实现浏览器兼容的捕获/冒泡两阶段事件模型：从目标节点向上收集所有祖先的捕获处理器（prepend）和冒泡处理器（append），按序调用并支持 `stopPropagation()` 和 `stopImmediatePropagation()`。事件优先级（Discrete / Continuous / Default）与 React Scheduler 集成，由 Reconciler 宿主配置的 `resolveUpdatePriority()` 读取，确保键盘、点击事件触发同步（Discrete）React 更新，鼠标移动、滚动触发连续（Continuous）更新。

### 6. 原生光标定位与 IME 支持

`use-declared-cursor.ts` 允许组件声明终端物理光标应停放的位置（相对于组件节点的偏移量）。`ink.tsx` 在每帧输出后，从 `nodeCache` 读取声明节点的当前屏幕坐标并计算绝对位置，最后通过 CUP（CSI row;col H）将物理光标移动到该位置。此机制使中日韩输入法（IME）的预编辑文本（Preedit）在视觉上准确跟随文本输入框的插入符（Caret），而非停留在帧内容末尾。

## 新增 / 重构 / 删除向导

### 新增

- **新增内置组件**：在 `components/` 下创建 `.tsx` 文件，使用 `ink-box` 或 `ink-text` 等原生节点类型；若需要新的节点类型，在 `dom.ts` 的 `ElementNames` 联合类型中注册，并在 `reconciler.ts` 的 `getChildHostContext()` 中更新上下文继承规则。
- **新增 Hook**：在 `hooks/` 下创建 `use-*.ts` 文件；若 Hook 需要读取 `Ink` 实例私有字段，通过 `instances.ts` 的注册表获取实例引用，而非直接引用闭包。
- **新增终端控制序列**：在 `termio/` 对应文件（CSI 序列加入 `csi.ts`，DEC 私有模式加入 `dec.ts`，OSC 序列加入 `osc.ts`）中添加生成函数或常量，并在 `termio.ts` 统一出口中重新导出。
- **新增事件类型**：在 `events/` 下创建事件类，继承 `TerminalEvent`；在 `event-handlers.ts` 的 `HANDLER_FOR_EVENT` 映射表中注册捕获和冒泡 prop 名称；在 `dispatcher.ts` 的 `getEventPriority()` 中为新类型指定调度优先级。
- 所有新增文件完成后，执行 `bun run check` 确保零错误，并为新增逻辑补充单元测试。

### 重构

- **渲染管线变更**：`onRender()` → `renderer()` → `renderNodeToOutput()` 构成单帧渲染的核心调用链，任何对帧率、损伤追踪、Blit 优化的修改须保证"前帧污染标志（prevFrameContaminated）→ 全区域损伤（Full-Damage）→ 差分引擎强制全比较"的因果约束不被破坏，否则将导致残留的选区或高亮像素无法清除。
- **Screen 内存布局变更**：`screen.ts` 的单元格打包格式（`word0`/`word1`）被 `diffEach()`、`setCellAt()`、`visibleCellAtIndex()`、`blitRegion()` 等多处直接操作；任何字段位宽或偏移调整须同步更新所有位操作常量（`STYLE_SHIFT`、`HYPERLINK_SHIFT`、`HYPERLINK_MASK`、`WIDTH_MASK`）。
- **StylePool ID 编码约定**：样式 ID 的最低位（bit 0）编码"该样式对空格是否可见"，渲染器通过此标志跳过不可见空格写入；添加新的可见空格效果时须在 `VISIBLE_ON_SPACE` 集合中注册对应的 `endCode`，否则相关单元格将被优化路径错误跳过。
- **全屏模式安全边界**：全屏模式下渲染高度强制限定为终端行数（`terminalRows`），`<AlternateScreen>` 之外的组件若意外成为其兄弟节点，将导致 Yoga 高度超出此限制并触发溢出裁剪警告。重构根布局时须确保所有顶层 UI 元素处于 `<AlternateScreen>` 内部。
- **SIGCONT 恢复策略**：本模块对 `SIGCONT` 信号的处理采用安全失败（Fail-Safe）策略——进程从挂起恢复时强制重置帧缓冲并全量重绘，宁可多写一帧，也不允许用已被 shell 修改的终端内容作为差分基准导致花屏。重构 SIGCONT 处理时须保留此重置逻辑。

### 删除

- **下线前置条件**：确认 `instances.ts` 注册表中无活跃实例，且 `src/entrypoints/` 的所有入口均不再调用 `render()` 或相关初始化函数。
- **删除内置组件**：追溯整个代码库中通过 `from '../ink/components/ComponentName.js'` 导入该组件的所有调用点，确保引用计数归零后方可删除文件；同步检查 `dom.ts` 是否有专属节点类型需要一并移除。
- **删除 Hook**：在 `hooks/` 删除文件前，搜索全项目中对该 Hook 导出名的所有引用，屏蔽每一处调用方后再删除。
- **删除事件类型**：从 `events/event-handlers.ts` 的 `HANDLER_FOR_EVENT` 映射表和 `dispatcher.ts` 的 `getEventPriority()` 中移除对应条目，并追溯所有以 `onXxx` / `onXxxCapture` 形式绑定的组件 prop。
- **删除 termio 序列**：确认 `ink.tsx`、`log-update.ts` 及其他调用方不再使用该序列常量或函数，避免遗留未定义引用导致终端控制序列静默丢失。
