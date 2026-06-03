# MCP Config Studio

纯静态 MCP 配置生成页，支持：

- 3 种连接方式：`stdio`、`streamable-http`、`sse`
- 3 个输出平台：`Claude Code`、`Codex`、`OpenClaw`
- 参数、环境变量、请求头、备注、超时等字段填充
- 一键复制当前平台配置或完整中间清单

## 本地开发

```powershell
npx wrangler dev
```

## Cloudflare Pages 部署

首次创建项目并部署：

```powershell
npx wrangler login
npx wrangler pages project create mcp-config-studio
npx wrangler pages deploy ./public --project-name mcp-config-studio
```

后续更新只需：

```powershell
npx wrangler pages deploy ./public --project-name mcp-config-studio
```

自定义域名在 Dashboard → Pages → mcp-config-studio → Custom domains 中绑定 `mcpc.10085.fun`。

## 文件说明

```
web/
├── public/           ← 静态资源（部署目标）
│   ├── index.html
│   ├── app.js
│   └── styles.css
└── wrangler.toml     ← 仅用于本地 dev
```
