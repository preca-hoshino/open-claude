# 贡献指南 (Contributing Guide)

> 项目概述、快速启动和 API 文档请参见 [README.md](README.md)。

## 开发流程

### 环境准备

本项目基于 [Bun](https://bun.sh/) 运行时，请确保已安装 Bun（版本 >= 1.3.10）。

```bash
# 安装依赖
bun install
```

### 提交前检查

在提交代码前，请务必运行以下命令以确保代码质量达到准入标准：

```bash
# 执行全量检查（包含代码格式化、Lint、类型检测、无用依赖检测及单元测试）
bun run check

# 如果涉及较多逻辑改动，也可以单独运行特定检查，例如运行测试：
bun run check:test
```

---

## 提交与 PR 规范 (Commit & PR Convention)

### 提交信息规范

提交信息应遵循你专属的 **`[Type]` 规范**，并且描述部分建议使用**简短的祈使句 (imperative mood)** （例如 `[Fix] Fix MCP config normalization` 或 `[Add] 补充缺失的 vendor 模块`）。

提交信息应严格遵循以下格式：

```text
[Type] 描述信息
```

**Type 类型列表：**

| Type      | 用途                                                         |
| --------- | ------------------------------------------------------------ |
| `[Add]`   | 新增功能或还原了某个缺失的特性                               |
| `[Fix]`   | 修复 Bug，或修复因还原回退导致的问题                         |
| `[Ref]`   | 代码重构（不改变外部逻辑）、或代码层面的性能/内存优化        |
| `[Del]`   | 删除冗余代码或文件                                           |
| `[Doc]`   | 修改文档或清晰化注释（例如编写 README、本规范指南等）        |
| `[Chore]` | 日常杂项维护（如更新包依赖、修改自动化构建流、脚手架配置）   |
| `[Style]` | 代码风格调整（如格式化、解决空格与缩进、Lint修复等不影响逻辑运行的改动） |
| `[Test]`  | 增补或修改测试代码/用例                                      |
| `[Merge]` | 分支合并记录                                                 |

### Pull Request (PR) 规范

提交 PR 时，请在描述中务必包含以下关键信息：

1. **用户可见影响 (User-visible impact)**：清晰说明该修改对 CLI 终端交互表现、系统状态产生了什么影响。
2. **技术重构与取舍说明 (Architecture & Tradeoffs)**：如果是针对指令执行、状态管理变更、以及外部依赖替换等修改，请说明采用该方案的背景及背后的取舍逻辑。
3. **验证步骤 (Validation steps)**：列出如何通过运行 `bun run dev` 或 `bun run start` 并在终端中复现测试的流程，并确保 `bun run check` 自动化检查全部通过。
4. **截图/录屏**：由于是基于 Ink 渲染的终端应用，在涉及到终端交互与展示变化时，请务必提供终端截图或简短的命令行录屏以供审核。

---

## 🌿 分支模型与镜像标签策略

本项目采用 **Git Flow 分支模型** 并配合 **语义化版本标签**，通过 GitHub Actions 自动化构建和镜像发布流程。

### 分支说明

| 分支类型  | 命名示例      | 说明                                                                                   |
| --------- | ------------- | -------------------------------------------------------------------------------------- |
| `master`  | `master`      | 默认分支，始终对应最新稳定版本。只允许合并，不接受直接提交。**仅此分支可打版本标签。** |
| `develop` | `develop`     | 主要开发集成分支，所有功能、重构、修复分支都从此切出，并通过 PR 合并回来。             |
| `feat/*`  | `feat/login`  | 新功能开发分支，从 `develop` 切出，完成后合并回 `develop`。                            |
| `ref/*`   | `ref/storage` | 代码重构分支，从 `develop` 切出，完成后合并回 `develop`。                              |
| `fix/*`   | `fix/bug-123` | 普通 bug 修复分支（非紧急），从 `develop` 切出，完成后合并回 `develop`。               |
| `release/*`| `release/v0.0.1-Ægir` | 发版预备分支，从 `develop` 切出，确认无误并改好版本号合进 `master` 触发发版。          |
| `docs/*`  | `docs/api`    | 纯文档修改的分支。                                                                     |
| `chore/*` | `chore/deps`  | 架构杂务或包依赖维护的分支。                                                           |
| `test/*`  | `test/unit`   | 专用于补充测试脚本的无底层代码改动分支。                                               |

### 版本标签与镜像标签

**正式发布标签**：`v<major>.<minor>.<patch>-<Codename>`，例如 `v0.0.1-Ægir`。

**版本命名规定**：
项目采用语义化版本规范 (Semantic Versioning) 加 代号 (Codename) 的规则。
**代号变更规范**：只有主版本号（Major，即 `A.B.C` 中的 `A`）变更时才需要更换代号；主版本不变时，代号保持不变。

⚠️ **重要**：**只有 `master` 分支上的提交才能打版本标签**。其他分支（包括 `develop`）都禁止打标签。标签打错后无法直接删除远程标签，必须通过团队负责人处理。

### 🤖 GitHub Actions CI/CD 工作流

有关详细实现，请参见 `.github/workflows/ci.yml`。

### 🚀 全流程实操示例

以下是基于本项目规范的标准开发与发布闭环。**强烈推荐使用原生 [GitHub Web 网页端](https://github.com/) 或 [GitHub CLI (`gh`)](https://cli.github.com/) 处理 Pull Request (PR) 审核和合并**，这比纯本地合并更透明、也更容易触发自动化流水线。

#### 1. 日常功能开发 (Feature / Bugfix)

**步骤 1：从 `develop` 签出新分支**
始终保持你的本地 `develop` 为最新，然后再切出开发分支。
```bash
git checkout develop
git pull origin develop
git checkout -b feat/user-profile
```

**步骤 2：原子化提交 (Atomic Commits)**
开发中提倡小步快跑，多次原子化提交，让复盘和回退更清晰。
```bash
# 仅仅完成基础代码时：
git add src/views/
git commit -m "[Add] Add user profile UI frame"

# 处理了某个指令解析相关的 Bug 时：
git add src/utils/
git commit -m "[Fix] Fix bash command output parser issue"

# 整理导入顺带格式化时：
git add src/views/
git commit -m "[Style] Format imports and clean up whitespaces"
```

**步骤 3：推送到远程并创建 PR**
将分支推送到远程仓库。
```bash
git push -u origin feat/user-profile
```
> 💡 **推荐操作**：
> 1. 推送结束后点击终端中提示的 GitHub 链接直接在网页端创建 PR；
> 2. 或者使用 GitHub CLI 快速创建：
> ```bash
> gh pr create --base develop --title "[Add] User Profile Module" --body "详见前述 PR 规范说明（影响、取舍、验证步骤）"
> ```

**步骤 4：CI 自动化验证与合并**
- 提交 PR 后，GitHub Actions （若已配置）会自动对该分支进行检查。
- 团队或自行审核通过后，**请直接在使用 `gh pr merge` 或者 GitHub 网页端点击 `Squash and merge` / `Merge pull request` 将其合并进 `develop`**（使用网页或CLI操作可以追溯完整的 PR 记录和讨论，请避免本地直接 merge）。

---

#### 2. 版本发布准备 (Release)

当 `develop` 分支集成了所有预定该版本发版的功能后，即可准备打版发布。

**步骤 1：切出发版分支并更新版本号**
严禁直接合并 `develop`，而是切出一个 `release/*` 分支来进行回归调测和版本更新。
```bash
git checkout develop
git pull origin develop
git checkout -b release/v0.0.1-Ægir

# 修改 package.json 等文件的版本号，然后提交
git add package.json
git commit -m "[Chore] Bump version to v0.0.1-Ægir"
git push -u origin release/v0.0.1-Ægir
```

**步骤 2：创建 Release PR (release -> master)**
通过 PR 让发版合并过程具备可审计性。
```bash
# 使用 GitHub CLI 直接发起一次发版 PR
gh pr create --base master --head release/v0.0.1-Ægir --title "[Merge] Release v0.0.1-Ægir" --body "### 包含内容: ..."
```

**步骤 3：合并至 `master`**
- 确保所有的代码验证严格通过（例如确认流水线或本地的 `bun run check` 未见红）。
- 在 GitHub 网页端（或通过 `gh pr merge`）将上述 PR 合并至 `master`。

**步骤 4：为 `master` 打点主干标签 (Tag)**
正式版本的触发依赖于 `master` 分支上的 Semantic Versioning 形式标签。你可以选择在本地打标签后推送，或者甚至直接在 Github Releases 面板进行图形操作。

**👉 选项 A：采用图形化操作 (推荐最佳实践):**
直接前往项目的 Github 网页 -> 左侧/右侧的 `Releases` -> `Draft a new release` -> Choose a tag (输入 `v0.0.1-Ægir` 并 Create) -> Target 选择 `master` -> 填写说明 -> `Publish release`。

**👉 选项 B：或采用本地命令行方式:**
```bash
git checkout master
git pull origin master
# 确认当前在 master
git branch

# 只有在 master 才可以打标准标签
git tag v0.0.1-Ægir
git push origin v0.0.1-Ægir
```

> ⚠️ **一旦标签生效，关联的 GitHub Actions 流水线将会自动**：
> - 运行最后的校验流程（执行 `bun run check`）；
> - 触发项目的构建与多平台相应产物的预编译操作；
> - 生成 Release 发布日志说明。
