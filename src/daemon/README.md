# src/daemon — 守护进程模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/jobs/README.md`](../jobs/README.md)（任务调度）

## 简介

Daemon 模块负责应用的长期驻留进程。该模块主要承载应用的后台 Worker 注册表和守护逻辑，以确保核心后台服务的持久运行与健康状态监控。

## 目录结构

```
daemon/
├── main.ts                          # 守护进程入口文件
├── workerRegistry.ts                # Worker 注册表，用于管理已启动的后台进程
└── __test__/                        # 测试目录
    └── ...
```
