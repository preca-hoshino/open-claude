---
trigger: model_decision
description: 强制全部测试文件放于 __test__ 目录内的 Jest 自动化测试实施规范指引
---

## 1. 测试文件结构 (Test Structure)
- **核心强制令**：所有的组件与源码测试文件**必须被包括在被测代码同级下的名为 `__test__` 的文件夹中**，严禁与源代码在任意层级混合散落放置。
- 测试文件的后缀命名固定为 `.test.ts` 或 `.test.js`。
- 测试名称必须具有描述性，需详细说明所预期的行为。
- 使用嵌套的 `describe` 块来梳理并组织相关的测试用例结构。
- 默认遵循的语法规则格式：`describe('Component/Function/Class', () => { it('should do something', () => {}) })`。

## 2. 高效的 Mock 策略 (Effective Mocking)
- 必须 Mock 外部依赖项（如外部 API接口、数据库等），以隔离不同测试环境，避免脏数据产生。
- 使用 `jest.mock()` 做包/模块级别的隔离模拟策略。
- 使用 `jest.spyOn()` 对特定的功能函数与对象方法进行监视与替换。
- 利用 `mockImplementation()` 或 `mockReturnValue()` 准确定义预期的 Mock 行为与返回数据。
- 每个测试用例隔离之后，需借助 `afterEach` 函数执行 `jest.resetAllMocks()` 以全局还原 Mock 状态。

## 3. 测试异步逻辑代码 (Testing Async Code)
- 测试异步逻辑时必须正确地返回 Promise 结构，或者使用 `async/await` 语法等待闭环。
- 推荐使用 `resolves` 或者 `rejects` 匹配断言来对 Promise 状态作预期测试。
- 如果测试中包含较为缓慢的网络、文件读写操作用例，需使用 `jest.setTimeout()` 正确延长特定超时配置并做出注释。

## 4. 快照测试 (Snapshot Testing)
- 对更新不频繁的底层复杂对象或固定结构的 UI Component，可部署自动化快照测试。
- 不要堆砌巨大无意义的 DOM，快照必须聚焦细节。
- 每次 commit 快照代码变更前，务必审慎检阅 diff。

## 5. React 组件相关测试 (Testing React Components)
- 使用 React Testing Library 工具（而非已被废弃的 Enzyme）进行相关组件测试。
- 重点检测用户的行为链路以及组件本身的无障碍能力（accessibility）。
- 优先采用无障碍角色定位元素，并通过角色名称、标签或文本内容锁定测试对象。
- 测试动作触发上优先选择通过 `userEvent` 而非传统的 `fireEvent`，以求更拟真地覆盖 DOM 操作链路。

## 6. 通用 Jest 断言查阅字典 (Common Matchers)
- 基础比对：`expect(value).toBe(expected)`, `expect(value).toEqual(expected)`
- boolean性断言：`expect(value).toBeTruthy()`, `expect(value).toBeFalsy()`
- 数字比大小判断：`expect(value).toBeGreaterThan(3)`, `expect(value).toBeLessThanOrEqual(3)`
- 字符串验证：`expect(value).toMatch(/pattern/)`, `expect(value).toContain('substring')`
- 数组或集合：`expect(array).toContain(item)`, `expect(array).toHaveLength(3)`
- 对象属性测试：`expect(object).toHaveProperty('key', value)`
- 异常外抛测试：`expect(fn).toThrow()`, `expect(fn).toThrow(Error)`
- Mock函数调用状况：`expect(mockFn).toHaveBeenCalled()`, `expect(mockFn).toHaveBeenCalledWith(arg1, arg2)`