# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a source reconstruction of `@anthropic-ai/claude-code` npm package (v2.1.88). The codebase还原了官方 Claude Code 的完整功能，包括所有 native 模块、内部依赖和类型定义。源码经过 React Compiler 编译，但逻辑和类型定义完整保留。

## Common Commands

```bash
# Install dependencies (requires Bun >= 1.3.10)
bun install

# Start CLI with isolated config (.claude-dev/)
bun run start

# Start with host ~/.claude config (inherits API key, plugins)
bun run start:home

# Run as MCP server
bun run mcp

# Development mode with file watching (hot reload)
bun run dev

# Code quality checks
bun run check:format   # Biome formatter
bun run check:lint     # ESLint + Biome lint
bun run check:types    # TypeScript
bun run check:deps     # knip unused code detection
bun run check:test     # Run tests
bun run check          # All checks
```

## Architecture

The project uses **Bun + Ink (terminal React)** as its core stack.

### Key Directories

- `src/entrypoints/` — CLI and MCP server entry points (`dev-cli.tsx`, `dev-mcp.ts`)
- `src/commands/` — Slash commands implementation (/help, /compact, /review, etc.)
- `src/tools/` — Agent tools (Bash, FileEdit, FileRead, Grep, Glob, WebFetch, etc.)
- `src/components/` — Ink (terminal React) UI components
- `src/services/` — Core services: MCP, OAuth, compact, LSP, etc.
- `src/state/` — Zustand store for AppState
- `src/skills/` — Built-in bundled skills (claude-api, verify, etc.)
- `src/types/` — Core type definitions
- `deps/@ant/` — Anthropic internal dependencies (computer-use-mcp, chrome-mcp)
- `vendor/` — Native modules (image-processor, audio-capture, url-handler)

### Native Modules (Full Platform Coverage)

All native modules extracted from Claude Code binaries across 6 platforms:

| Module | darwin-arm64 | darwin-x64 | linux-arm64 | linux-x64 | win32-arm64 | win32-x64 |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|
| image-processor | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| audio-capture | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| computer-use-input | ✅ | ✅ | — | — | — | — |
| computer-use-swift | ✅ | ✅ | — | — | — | — |
| url-handler | ✅ | ✅ | — | — | — | — |

### Feature Flags

The codebase contains 90+ feature flags controlled by `bun:bundle` `feature()`. In dev mode (`bun run start`), these are runtime-evaluated. All flag code is preserved in source. Key flags include: VOICE_MODE, COMPUTER_USE, KAIROS, ULTRATHINK, MCP_SKILLS, WEB_BROWSER_TOOL.

### Key Files

- `src/main.tsx` — Main application entry (~800KB, the largest file)
- `src/query.ts` — Query processing logic
- `src/QueryEngine.ts` — Query engine implementation
- `src/commands.ts` — Command definitions
- `src/tools.ts` — Tool definitions
- `global.d.ts` — Global type declarations
- `text-imports.d.ts` — Markdown/React/Ink type declarations

### TypeScript

The project started with 1,556 tsc errors and was fixed to 63 remaining errors (96% fixed). Most remaining errors are:
- 50 "external" === "ant" branch dead code (build-time only)
- 12 deps type narrowings
- 1 Zod generic inference

### Configuration

- `biome.jsonc` — Biome linter/formatter config (JSX quotes: single, indent: 2 spaces, lineWidth: 120)
- `eslint.config.js` — ESLint with boundaries plugin
- `knip.json` — Unused code detection
- `tsconfig.json` — TypeScript config