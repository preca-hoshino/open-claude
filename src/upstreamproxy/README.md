# CCR 上游代理网关 (`upstreamproxy`)

本模块是运行于 CCR（Claude Container Runtime）容器端的上游代理通信网关。它通过在本地启动中继（Relay）并在环境变量级进行拦截，允许大模型生成的工具或进程透明地通过组织级代理或网关（MITM）访问外部网络。

## 核心实现逻辑

### 1. 代理初始化与身份鉴权 (`upstreamproxy.ts`)
- **权限与环境检查**：`initUpstreamProxy` 检查是否运行在 CCR 环境下（`CLAUDE_CODE_REMOTE`），并且网关开关（`CCR_UPSTREAM_PROXY_ENABLED`）是否被服务端激活。
- **证书提取与注入**：模块会向 Anthropic 后端（`ANTHROPIC_BASE_URL`）下载代理特制的 CA 根证书，并与本地容器的根证书（`/etc/ssl/certs/ca-certificates.crt`）进行拼接（Concat）。
- **进程隐藏（反转储）**：通过 `ffi` 调用 `libc` 的 `prctl(PR_SET_DUMPABLE, 0)`，防止子进程（如通过提示词注入诱导模型执行的 `gdb`）通过 `ptrace` 抓取包含在内存中的连接凭证（Session Token）。

### 2. HTTP CONNECT 隧道代理 (`relay.ts`)
为了规避直接的防火墙封锁，代理不走标准的 TCP 直连，而是通过 WebSocket 建立 `HTTP CONNECT` 隧道。
- **本地监听**：`startUpstreamProxyRelay` 会在 `127.0.0.1` 绑定一个临时 TCP 端口，伪装成常规的 HTTP 代理服务器。
- **WebSocket 升级**：截获来自子进程的 `CONNECT` 请求后，代理向后端的 `ws://` 网关发起升级请求。在这个升级请求中注入了认证所需的 JWT（`Bearer` 协议）以及代理授权头（`Proxy-Authorization`）。
- **Protobuf 二进制包裹**：由于后端的 `NewWebSocketStreamAdapter` 依赖特定的 Protobuf 格式解析流量，`encodeChunk` 会手工编码 `UpstreamProxyChunk` 的 Protobuf 头部（Tag `0x0a` 和可变长长度 `varint`），从而免去了引入重量级 Protobuf 库的开销。
- **长连接与保活**：由于边车（Sidecar）的空闲超时时间限制，中继包含了主动的 `Ping` 保活机制（发送长度为 0 的字节块）。

### 3. 环境注入与拦截 (`upstreamproxy.ts`)
- **注入环境变量**：通过 `getUpstreamProxyEnv()` 暴露出 `HTTPS_PROXY`，`NO_PROXY`，`SSL_CERT_FILE` 以及其它常见的证书路径变量（如 `NODE_EXTRA_CA_CERTS`）。
- **流量白名单**：内置了 `NO_PROXY_LIST`。禁止代理拦截内网回环地址、IMDS 元数据服务段（`169.254.0.0/16`），以及模型与 NPM、PyPI、Crates.io、GitHub 的直连流量。更重要的是，它明确排除了对 `*.anthropic.com` 的代理拦截，避免陷入代理环或因 MITM 而破坏 Python `httpx` 的内置证书链验证。

## 维护规范

- **故障敞口 (Fail-open) 策略**：如果代理 CA 下载失败、WebSocket 升级失败或令牌缺失，系统只会记录日志（`logForDebugging`）并默默降级为**直连模式**（不拦截流量）。严禁在上述任何步骤中向顶层抛出错误导致会话崩溃。
- **Node 与 Bun 的双重兼容**：`relay.ts` 必须兼容两种 JS 引擎。因为 CCR 在底层往往运行的是基于 Node.js 编译的 CLI，在修改 WebSocket 初始化（`Bun.listen` 与 `createServer`）时请同时覆盖两套运行时。
- **二进制内存安全**：处理 Buffer 切片和合并时，需特别关注由于粘包导致的未完成请求拦截。在 `handleData` 中的 Phase 1 阶段保证了完整的 `\r\n\r\n` 请求头探测。
