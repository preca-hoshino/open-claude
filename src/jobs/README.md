# src/jobs — 任务调度与处理模块

> 项目总览：参见 [README.md](../../README.md)
> 
> 相关模块：[`src/daemon/README.md`](../daemon/README.md)（守护进程）、[`src/proactive/README.md`](../proactive/README.md)（主动式任务）

## 简介

Jobs 模块主要用于管理和调度后台作业。它包含将各种异步任务进行分类、排队和分发的逻辑，确保各项系统任务和异步流程高效、有序地运行。

## 目录结构

```
jobs/
├── classifier.ts                    # 任务分类器，负责鉴别并分配任务类型
└── __test__/                        # 测试目录
    └── ...
```
