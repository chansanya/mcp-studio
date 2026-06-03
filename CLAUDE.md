# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP Config Studio — 纯静态的 MCP 配置生成器。支持 3 种传输方式（stdio / streamable-http / sse），可输出 3 种平台格式（Claude Code JSON / Codex TOML / OpenClaw JSON）。无构建工具、无框架、无打包。

## Development Commands

```bash
# 本地开发（Cloudflare Pages 本地模拟）
npx wrangler dev

# 部署到 Cloudflare Pages
npx wrangler pages deploy ./public --project-name mcp-config-studio
```

Node 版本：22（见 `.node-version`）。无 lint / test / build 命令。

## Architecture

整个应用由 3 个静态文件组成，无构建步骤，`public/` 即部署目录：

- **`public/index.html`** — 单页应用壳，定义 UI 结构
- **`public/app.js`** — 全部业务逻辑，ES module，约 760 行
  - `state` 对象持有内存状态（platform / selectedTab / servers 数组）
  - `renderAll()` 驱动全量 DOM 重绘；各 `render*()` 函数分别渲染区域
  - `buildPortableManifest()` → `buildClaudeConfig()` / `buildCodexToml()` / `buildOpenClawConfig()` 按平台生成输出
  - `builtInMcpPresets` 内置预设卡片数据源
  - 事件通过 `wireEvents()` 代理绑定
- **`public/styles.css`** — 全部样式，暗色主题，CSS 变量体系

- **`wrangler.toml`** — 仅用于本地 `wrangler dev`，配置 `assets.directory = "./public"` 和 SPA 回退

## Output Format Mapping

| 平台 | 格式 | 函数 |
|------|------|------|
| Claude Code | JSON `{"mcpServers": {...}}` | `buildClaudeConfig()` |
| Codex | TOML `[mcp_servers.xxx]` blocks | `buildCodexToml()` |
| OpenClaw | JSON `{"mcpServers": {...}, "meta": {...}}` | `buildOpenClawConfig()` |
