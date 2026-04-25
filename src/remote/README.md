# src/remote — 远程服务端与客户端通信中枢

> 参见 [README.md](../../README.md)
> 相关模块：[`src/constants`](../constants/README.md)（获取 OAuth 等底层连接所需的网络配置变量）

## 简介

本模块负责在前端应用客户端与远程 Claude Container Runtime (CCR) 服务器之间建立并维持双工通信与核心指令同步。它通过将底层的 HTTP 与 WebSocket 网络传输通道解耦，并结合安全容错的协议状态机与反序列化转换层，确保来自远程系统的模型输出事件与动态工具权限审批流程能安全、准确地投影到本地会话视图中。

## 目录结构

```text
remote/
├── RemoteSessionManager.ts      # 业务层控制中枢，统管上下行消息分发、生命周期与权限申请流转
├── SessionsWebSocket.ts         # 底层长连接管理，承载连接认证、自动重连退避策略与心跳保活
├── remotePermissionBridge.ts    # 远程权限桥接沙盒，为未知的远端工具动态生成本地执行与渲染的占位存根
├── sdkMessageAdapter.ts         # 协议转换适配器，将远端 SDK 数据结构安全反序列化为本地视图直接消费的消息模型
└── __test__/                    # 单元与集成测试目录
```

## 实现逻辑

### 1. 长连接通道与容错保活
入口点位于 `SessionsWebSocket.ts` 中的 `SessionsWebSocket` 类。
本模块封装了基于 `wss://` 的事件订阅链路，并在连接握手时通过请求头注入 OAuth 令牌完成隐式鉴权。为保障弱网和状态收缩时的稳定性，内建了心跳检测机制（Ping/Pong）与基于有限次指数退避的重试机制，特别针对服务端内存状态压缩时的 `4001` (Session Not Found) 状态设计了专门的瞬时重连宽容策略，而遇到鉴权失败等严重错误则触发永久中断。

### 2. 双工解耦与会话业务流转
入口点位于 `RemoteSessionManager.ts` 中的 `RemoteSessionManager` 类。
作为业务控制接合点，它实现了数据流与指令流的彻底分离：下行事件订阅依靠 WebSocket 接收，上行消息抛送则通过 HTTP POST 完成。该层会拦截并分离普通的会话流事件与特殊的鉴权控制请求（Control Request），确保服务端下发的权限确认指令（如 `can_use_tool`）能够准时触发挂起，并等待前端的异步审批响应（Control Response），以此闭环跨网络的权限沙盒确认链。

### 3. 数据协议展平与安全转换
入口点位于 `sdkMessageAdapter.ts`。
充当从远端生硬的网络格式到本地视图格式的反序列化映射层（Adapter Pattern）。针对服务端发送的流式事件、状态转换事件、边界划分包以及嵌套深层的富文本块，在保证类型安全和安全失败（Fail-safe）原则下，执行解析、抹平与有效性过滤，确保前端 REPL 只消费合规的实体对象并安全剔除无效的未知网络包噪音。

### 4. 远程权限占位桥接
入口点位于 `remotePermissionBridge.ts`。
当远程运行态（CCR）触发执行本地未预装的新型动态工具能力（如 MCP 远程工具）时，该机制通过动态生成合成的消息上下文（Synthetic Assistant Message）与模拟执行占位符（Tool Stub），使得本地的安全视图能够透明地渲染该申请请求并正确拦截不安全的越权指令。

## 新增 / 重构 / 删除向导

### 新增
- 增加远端 WebSocket 推送的新型协议格式时，必须在 `sdkMessageAdapter.ts` 中添加对应的安全解析转换逻辑，并补充涵盖成功转换与异常抹平路径的单元测试。
- 扩展服务端控制面的指令响应规约时，需在 `remotePermissionBridge.ts` 及 `RemoteSessionManager.ts` 中同步实现针对该指令的生命周期处理钩子。

### 重构
- 严禁擅自缩减 `SessionsWebSocket.ts` 中定义的心跳间隔常量及重连退避相关的最大宽容次数，须全面兼顾生产物理网络波动与后端实例资源回收导致的暂态无响应现象。
- 必须确保所有的网络包反序列化或消息类型分发流中均包含安全失败（Fail-safe）逻辑（如返回 `ignored`），绝不因无法识别的新型网络负载导致主线程渲染崩溃。

### 删除
- 下线某类远端数据类型支持时，请从 `sdkMessageAdapter.ts` 的解析字典中彻底剥离相关结构映射，并让其隐式退化为丢弃规则。
- 必须从整个渲染视图层面上追溯并清理针对该废弃协议字段渲染的所有关联界面组件点位，以阻断渲染树未定义的引用异常与潜在的内存泄漏风险。
