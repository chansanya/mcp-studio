const platformPresets = {
  claude: {
    label: "Claude Code"
  },
  codex: {
    label: "Codex"
  },
  openclaw: {
    label: "OpenClaw"
  },
  ccswitch: {
    label: "cc-switch"
  }
};


const builtInMcpPresets = [
  {
    name: "filesystem",
    displayName: "filesystem",
    summary: "本地文件系统访问，适合读写工作区目录。",
    transport: "stdio",
    endpoint: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "D:/tools/file"],
    env: { NODE_ENV: "production", MCP_LOG_LEVEL: "info" },
    headers: {},
    notes: "本地文件系统示例",
    timeout: "0"
  },
  {
    name: "github",
    displayName: "github",
    summary: "GitHub 仓库与 PR 操作的常用 MCP。",
    transport: "stdio",
    endpoint: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_xxx" },
    headers: {},
    notes: "GitHub MCP",
    timeout: "0"
  },
  {
    name: "mysql",
    displayName: "mysql",
    summary: "数据库查询与管理，适合连接 MySQL 实例。",
    transport: "stdio",
    endpoint: "npx",
    args: ["@benborla29/mcp-server-mysql"],
    env: {
      MYSQL_HOST: "127.0.0.1",
      MYSQL_PORT: "3306",
      MYSQL_USER: "root",
      MYSQL_PASS: "password",
      MYSQL_DB: "app"
    },
    headers: {},
    notes: "MySQL MCP",
    timeout: "0"
  },
  {
    name: "ssh",
    displayName: "ssh",
    summary: "SSH 远程执行与运维控制。",
    transport: "stdio",
    endpoint: "npx",
    args: [
      "-y",
      "@fangjunjie/ssh-mcp-server",
      "--ssh",
      '{"name":"prod","host":"127.0.0.1","port":22,"username":"root","password":"password"}'
    ],
    env: {},
    headers: {},
    notes: "SSH MCP 示例",
    timeout: "0"
  },
  {
    name: "fetch",
    displayName: "fetch",
    summary: "HTTP 请求工具，适合调用外部 API。",
    transport: "stdio",
    endpoint: "npx",
    args: ["-y", "@modelcontextprotocol/server-fetch"],
    env: {},
    headers: {},
    notes: "Fetch MCP",
    timeout: "0"
  },
  {
    name: "context7",
    displayName: "context7",
    summary: "文档检索与上下文增强，适合技术文档查询。",
    transport: "stdio",
    endpoint: "npx",
    args: ["-y", "@upstash/context7-mcp"],
    env: {},
    headers: {},
    notes: "Context7 MCP",
    timeout: "0"
  },
  {
    name: "sequential-thinking",
    displayName: "sequential-thinking",
    summary: "分步推理与思维链工具。",
    transport: "stdio",
    endpoint: "npx",
    args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
    env: {},
    headers: {},
    notes: "Sequential Thinking MCP",
    timeout: "0"
  },
  {
    name: "memory",
    displayName: "memory",
    summary: "持久化记忆存储，适合会话上下文保留。",
    transport: "stdio",
    endpoint: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
    env: {},
    headers: {},
    notes: "Memory MCP",
    timeout: "0"
  }
];

const transportLabels = {
  stdio: "stdio",
  http: "streamable-http",
  sse: "sse"
};

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `mcp-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

function cloneObject(value) {
  return JSON.parse(JSON.stringify(value));
}

function formatMultilineObject(obj) {
  return Object.entries(obj)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

function makeServer(overrides = {}) {
  const base = {
    id: newId(),
    name: "server",
    transport: "stdio",
    endpoint: "npx",
    args: "",
    env: "",
    headers: "",
    notes: "",
    timeout: "0",
    collapsed: false
  };

  return { ...base, ...overrides, id: overrides.id || base.id };
}

function serverFromPreset(preset) {
  return makeServer({
    name: preset.name,
    transport: preset.transport,
    endpoint: preset.endpoint,
    args: preset.args.join("\n"),
    env: formatMultilineObject(preset.env),
    headers: formatMultilineObject(preset.headers),
    notes: preset.notes,
    timeout: preset.timeout
  });
}

const state = {
  platform: "claude",
  os: "linux",
  scope: "project",
  outputMode: "config",
  servers: []
};

const el = {
  platformSwitcher: document.getElementById("platformSwitcher"),
  osSwitcher: document.getElementById("osSwitcher"),
  scopeSwitcher: document.getElementById("scopeSwitcher"),
  modeSwitcher: document.getElementById("modeSwitcher"),
  connections: document.getElementById("connections"),
  presetGrid: document.getElementById("presetGrid"),
  snippet: document.getElementById("snippet"),
  copySnippetBtn: document.getElementById("copySnippetBtn"),
  addConnectionBtn: document.getElementById("addConnectionBtn"),
  clearAllBtn: document.getElementById("clearAllBtn")
};

function parseKeyValueLines(input) {
  const result = {};
  for (const rawLine of input.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

function parseListLines(input) {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function serverArgs(server) {
  return Array.isArray(server.args) ? server.args : [];
}

function serverEnv(server) {
  return server && typeof server.env === "object" && server.env !== null ? server.env : {};
}

function serverHeaders(server) {
  return server && typeof server.headers === "object" && server.headers !== null ? server.headers : {};
}

function makeUniqueServerName(desiredName, excludeIndex = -1) {
  const baseName = String(desiredName || "server").trim() || "server";
  const used = new Set();

  state.servers.forEach((server, index) => {
    if (index !== excludeIndex) {
      used.add(server.name);
    }
  });

  if (!used.has(baseName)) {
    return baseName;
  }

  let suffix = 2;
  while (used.has(`${baseName}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseName}-${suffix}`;
}

function escapeTomlString(value) {
  return `"${String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function tomlArray(values) {
  return `[${values.map((value) => escapeTomlString(value)).join(", ")}]`;
}

function tomlInlineTable(entries) {
  const parts = Object.entries(entries).map(([key, value]) => `${key} = ${escapeTomlString(value)}`);
  return `{ ${parts.join(", ")} }`;
}

function sanitizeTomlKey(value) {
  return String(value)
    .trim()
    .replaceAll(/[^A-Za-z0-9_-]/g, "_")
    .replaceAll(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "server";
}

function toManifestServers() {
  return state.servers.map((server) => {
    const args = server.transport === "stdio" ? parseListLines(server.args) : [];
    const env = server.transport === "stdio" ? parseKeyValueLines(server.env) : {};
    const headers = parseKeyValueLines(server.headers);

    const entry = {
      name: server.name || "unnamed",
      transport: server.transport,
      endpoint: server.endpoint,
      notes: server.notes,
      timeout: server.timeout === "" ? null : Number(server.timeout),
      collapsed: server.collapsed
    };

    if (args.length > 0) {
      entry.args = args;
    }

    if (Object.keys(env).length > 0) {
      entry.env = env;
    }

    if (Object.keys(headers).length > 0) {
      entry.headers = headers;
    }

    return entry;
  });
}

function buildPortableManifest() {
  return {
    schema: "mcp-config-studio/v1",
    generatedAt: new Date().toISOString(),
    platform: state.platform,
    servers: toManifestServers()
  };
}

function stdioCommand(server) {
  if (state.os === "windows") {
    return { command: "cmd", args: ["/c", server.endpoint, ...serverArgs(server)] };
  }
  return { command: server.endpoint, args: serverArgs(server) };
}

function buildClaudeConfig(manifest) {
  const servers = {};

  for (const server of manifest.servers) {
    const env = serverEnv(server);
    const headers = serverHeaders(server);

    if (server.transport === "stdio") {
      const { command, args } = stdioCommand(server);
      const entry = {
        type: "stdio",
        command,
      };

      if (args.length > 0) {
        entry.args = args;
      }

      if (Object.keys(env).length > 0) {
        entry.env = env;
      }

      servers[server.name] = entry;
    } else {
      const entry = { type: server.transport, url: server.endpoint };
      if (Object.keys(headers).length > 0) {
        entry.headers = headers;
      }
      servers[server.name] = entry;
    }
  }

  return JSON.stringify({ mcpServers: servers }, null, 2);
}

function buildCodexToml(manifest) {
  const blocks = [];

  for (const server of manifest.servers) {
    const env = serverEnv(server);
    const headers = serverHeaders(server);
    const key = sanitizeTomlKey(server.name);
    const lines = [`[mcp_servers.${key}]`];
    lines.push(`type = ${escapeTomlString(server.transport)}`);

    if (server.transport === "stdio") {
      const { command, args } = stdioCommand(server);
      lines.push(`command = ${escapeTomlString(command)}`);
      if (args.length > 0) {
        lines.push(`args = ${tomlArray(args)}`);
      }
      if (Object.keys(env).length > 0) {
        lines.push("");
        lines.push(`[mcp_servers.${key}.env]`);
        for (const [k, v] of Object.entries(env)) {
          lines.push(`${k} = ${escapeTomlString(v)}`);
        }
      }
    } else {
      lines.push(`url = ${escapeTomlString(server.endpoint)}`);
      if (Object.keys(headers).length > 0) {
        lines.push("");
        lines.push(`[mcp_servers.${key}.headers]`);
        for (const [k, v] of Object.entries(headers)) {
          lines.push(`${k} = ${escapeTomlString(v)}`);
        }
      }
    }

    blocks.push(lines.join("\n"));
  }

  return blocks.join("\n\n");
}

function buildOpenClawConfig(manifest) {
  const servers = {};

  for (const server of manifest.servers) {
    const env = serverEnv(server);
    const headers = serverHeaders(server);
    const entry = {};

    if (server.transport === "stdio") {
      const { command, args } = stdioCommand(server);
      entry.command = command;
      if (args.length > 0) {
        entry.args = args;
      }
      if (Object.keys(env).length > 0) {
        entry.env = env;
      }
    } else {
      entry.url = server.endpoint;
      if (Object.keys(headers).length > 0) {
        entry.headers = headers;
      }
    }

    servers[server.name] = entry;
  }

  return JSON.stringify(servers, null, 2);
}

function buildCcSwitchConfig(manifest) {
  const configs = [];

  for (const server of manifest.servers) {
    const env = serverEnv(server);
    const headers = serverHeaders(server);
    const entry = { type: server.transport };

    if (server.transport === "stdio") {
      const { command, args } = stdioCommand(server);
      entry.command = command;
      if (args.length > 0) {
        entry.args = args;
      }
      if (Object.keys(env).length > 0) {
        entry.env = env;
      }
    } else {
      entry.url = server.endpoint;
      if (Object.keys(headers).length > 0) {
        entry.headers = headers;
      }
    }

    configs.push(entry);
  }

  return configs.map(c => JSON.stringify(c, null, 2)).join("\n\n");
}

function renderSnippet() {
  const manifest = buildPortableManifest();

  // Codex / OpenClaw / cc-switch 只能输出配置文件
  if (state.platform !== "claude" || state.outputMode === "config") {
    if (state.platform === "claude") {
      el.snippet.textContent = buildClaudeConfig(manifest);
      return;
    }
    if (state.platform === "codex") {
      el.snippet.textContent = buildCodexToml(manifest);
      return;
    }
    if (state.platform === "ccswitch") {
      el.snippet.textContent = buildCcSwitchConfig(manifest);
      return;
    }
    el.snippet.textContent = buildOpenClawConfig(manifest);
    return;
  }

  el.snippet.textContent = buildCliCommands(manifest);
}

function buildCliCommands(manifest) {
  const blocks = [];

  for (const server of manifest.servers) {
    const env = serverEnv(server);
    const lines = [`# ${server.name} (${server.transport})`];

    if (server.transport === "stdio") {
      const { command, args } = stdioCommand(server);
      lines.push(`claude mcp add ${server.name} \\`);
      lines.push(`  --scope ${state.scope} \\`);
      for (const [k, v] of Object.entries(env)) {
        lines.push(`  --env ${k}=${v} \\`);
      }
      const allArgs = [command, ...args].join(" ");
      lines.push(`  -- ${allArgs}`);
    } else {
      const headers = serverHeaders(server);
      lines.push(`claude mcp add ${server.name} \\`);
      lines.push(`  --scope ${state.scope} \\`);
      lines.push(`  --transport ${server.transport} \\`);
      lines.push(`  ${server.endpoint}`);
      for (const [k, v] of Object.entries(headers)) {
        lines.push(`#   header: ${k}=${v}`);
      }
    }

    blocks.push(lines.join("\n"));
  }

  return blocks.join("\n\n");
}

function renderScopeSwitch() {
  const visible = state.platform === "claude" && state.outputMode === "cli";
  el.scopeSwitcher.style.display = visible ? "" : "none";
  if (!visible) return;

  const items = [
    { key: "project", label: "📁 项目" },
    { key: "user", label: "🌐 全局" },
  ];
  el.scopeSwitcher.innerHTML = items
    .map(
      ({ key, label }) =>
        `<button class="segment ${state.scope === key ? "active" : ""}" data-scope="${key}" type="button">${label}</button>`
    )
    .join("");
}

function renderModeSwitch() {
  const allowCli = state.platform === "claude";
  if (!allowCli && state.outputMode === "cli") {
    state.outputMode = "config";
  }

  const items = [
    { key: "config", label: "📄 配置文件" },
    { key: "cli", label: "📋 CLI 命令", claudeOnly: true },
  ];
  el.modeSwitcher.innerHTML = items
    .map(
      ({ key, label, claudeOnly }) => {
        const dis = claudeOnly && !allowCli ? "disabled" : "";
        return `<button class="segment ${state.outputMode === key ? "active" : ""} ${dis}" data-mode="${key}" type="button">${label}</button>`;
      }
    )
    .join("");
}

function renderOsSwitch() {
  const items = [
    { key: "linux", label: "Linux" },
    { key: "windows", label: "Windows" },
  ];
  el.osSwitcher.innerHTML = items
    .map(
      ({ key, label }) =>
        `<button class="segment ${state.os === key ? "active" : ""}" data-os="${key}" type="button">${label}</button>`
    )
    .join("");
}

function renderSwitcher() {
  el.platformSwitcher.innerHTML = Object.entries(platformPresets)
    .map(
      ([key, value]) =>
        `<button class="segment ${state.platform === key ? "active" : ""}" data-platform="${key}" type="button">${value.label}</button>`
    )
    .join("");
}

function endpointLabel(transport) {
  if (transport === "stdio") return "命令 / command";
  if (transport === "http") return "URL / Streamable HTTP";
  return "URL / SSE";
}

function renderPresetGrid() {
  el.presetGrid.innerHTML = builtInMcpPresets
    .map(
      (preset) => `
        <button class="preset-chip" type="button" data-preset="${preset.name}">
          <div class="preset-topline">
            <span class="preset-name">${preset.displayName}</span>
            <span class="preset-meta">${transportLabels[preset.transport]}</span>
          </div>
          <small class="preset-summary">${preset.summary}</small>
        </button>`
    )
    .join("");
}

function renderConnections() {
  if (state.servers.length === 0) {
    el.connections.innerHTML = `
      <div class="empty-state">
        <h3>当前没有连接卡片</h3>
        <p>你可以点击"新增"或点选下方内置 MCP，重新开始配置。</p>
        <button class="primary-button" type="button" data-empty-add>新增项</button>
      </div>`;
    return;
  }

  el.connections.innerHTML = state.servers
    .map((server, index) => {
      const collapsedClass = server.collapsed ? "is-collapsed" : "";
      const stdioOnlyClass = server.transport === "stdio" ? "" : "is-hidden";

      return `
        <article class="connection-card ${collapsedClass}" data-index="${index}">
          <div class="connection-top">
            <div class="connection-title-wrap">
              <span class="connection-index">Slot ${String(index + 1).padStart(2, "0")}</span>
              <input class="card-title-input" type="text" data-field="name" value="${escapeAttr(server.name)}" />
            </div>
            <div class="card-actions">
              <span class="transport-pill">${transportLabels[server.transport]}</span>
              <button class="icon-button" type="button" data-action="toggle-collapse" title="折叠/展开">
                ${server.collapsed ? "展开" : "折叠"}
              </button>
              <button class="icon-button danger" type="button" data-action="delete-card" title="删除卡片">
                删除
              </button>
            </div>
          </div>

          <div class="field-grid ${server.collapsed ? "collapsed" : ""}">
            <label class="field">
              <span>连接方式</span>
              <select data-field="transport">
                <option value="stdio" ${server.transport === "stdio" ? "selected" : ""}>stdio</option>
                <option value="http" ${server.transport === "http" ? "selected" : ""}>streamable-http</option>
                <option value="sse" ${server.transport === "sse" ? "selected" : ""}>sse</option>
              </select>
            </label>

            <label class="field span-2 connection-endpoint">
              <span>${endpointLabel(server.transport)}</span>
              <input type="text" data-field="endpoint" value="${escapeAttr(server.endpoint)}" />
            </label>

            <label class="field span-2 ${stdioOnlyClass}">
              <span>参数 / args</span>
              <textarea rows="3" data-field="args" placeholder="-y&#10;@modelcontextprotocol/server-filesystem&#10;D:/tools/file">${escapeHtml(server.args)}</textarea>
            </label>

            <label class="field span-2 ${stdioOnlyClass}">
              <span>环境变量 / env</span>
              <textarea rows="4" data-field="env" placeholder="MYSQL_HOST=127.0.0.1&#10;MYSQL_PORT=3306">${escapeHtml(server.env)}</textarea>
            </label>

            <label class="field span-2 request-field ${server.transport === "stdio" ? "is-hidden" : ""}">
              <span>请求信息 / headers</span>
              <textarea rows="4" data-field="headers" placeholder="Authorization=Bearer xxx&#10;x-trace-id=demo-001">${escapeHtml(server.headers)}</textarea>
            </label>

          </div>
        </article>`;
    })
    .join("");
}

function escapeAttr(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderAll() {
  renderSwitcher();
  renderPresetGrid();
  renderConnections();
  renderOsSwitch();
  renderScopeSwitch();
  renderModeSwitch();
  renderSnippet();
}

function resetWorkspaceForPlatformSwitch() {
  // 只保留切换逻辑，不清空 server
}

function updateServer(index, field, value) {
  const server = state.servers[index];
  server[field] = value;
  if (field === "name") {
    server.name = makeUniqueServerName(value, index);
  }
}

function addServerFromPreset(preset) {
  const nextServer = serverFromPreset(cloneObject(preset));
  nextServer.name = makeUniqueServerName(nextServer.name);
  state.servers.push(nextServer);
  renderAll();
}

function addBlankServer() {
  const name = makeUniqueServerName(`server-${state.servers.length + 1}`);
  state.servers.push(
    makeServer({
      name,
      transport: "stdio"
    })
  );
  renderAll();
}

function deleteServer(index) {
  state.servers.splice(index, 1);
  renderAll();
}

function toggleCollapse(index) {
  state.servers[index].collapsed = !state.servers[index].collapsed;
  renderConnections();
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

function wireEvents() {
  el.platformSwitcher.addEventListener("click", (event) => {
    const button = event.target.closest("[data-platform]");
    if (!button) return;
    state.platform = button.dataset.platform;
    if (state.platform !== "claude") {
      state.outputMode = "config";
    }
    resetWorkspaceForPlatformSwitch();
    renderAll();
  });

  el.osSwitcher.addEventListener("click", (event) => {
    const button = event.target.closest("[data-os]");
    if (!button) return;
    state.os = button.dataset.os;
    renderOsSwitch();
    renderSnippet();
  });

  el.scopeSwitcher.addEventListener("click", (event) => {
    const button = event.target.closest("[data-scope]");
    if (!button) return;
    state.scope = button.dataset.scope;
    renderScopeSwitch();
    renderSnippet();
  });

  el.modeSwitcher.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mode]");
    if (!button) return;
    if (button.classList.contains("disabled")) return;
    state.outputMode = button.dataset.mode;
    renderModeSwitch();
    renderScopeSwitch();
    renderSnippet();
  });

  el.presetGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset]");
    if (!button) return;
    const preset = builtInMcpPresets.find((item) => item.name === button.dataset.preset);
    if (preset) {
      addServerFromPreset(preset);
    }
  });

  el.addConnectionBtn.addEventListener("click", () => {
    addBlankServer();
  });

  el.clearAllBtn.addEventListener("click", () => {
    state.servers = [];
    renderAll();
  });

  el.connections.addEventListener("input", (event) => {
    const target = event.target;
    const card = target.closest(".connection-card");
    if (!card || !target.dataset.field) return;
    const index = Number(card.dataset.index);
    updateServer(index, target.dataset.field, target.value);
    if (target.dataset.field === "name" || target.dataset.field === "transport") {
      renderConnections();
    }
    renderSnippet();
  });

  el.connections.addEventListener("change", (event) => {
    const target = event.target;
    const card = target.closest(".connection-card");
    if (!card || !target.dataset.field) return;
    const index = Number(card.dataset.index);
    updateServer(index, target.dataset.field, target.value);
    if (target.dataset.field === "name" || target.dataset.field === "transport") {
      renderConnections();
    }
    renderSnippet();
  });

  el.connections.addEventListener("click", (event) => {
    const emptyAdd = event.target.closest("[data-empty-add]");
    if (emptyAdd) {
      addBlankServer();
      return;
    }

    const button = event.target.closest("[data-action]");
    if (!button) return;
    const card = button.closest(".connection-card");
    if (!card) return;
    const index = Number(card.dataset.index);

    if (button.dataset.action === "toggle-collapse") {
      toggleCollapse(index);
      return;
    }

    if (button.dataset.action === "delete-card") {
      deleteServer(index);
    }
  });

  el.copySnippetBtn.addEventListener("click", async () => {
    await copyText(el.snippet.textContent || "");
    el.copySnippetBtn.classList.add("is-copied");
    el.copySnippetBtn.title = "已复制";
    el.copySnippetBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    setTimeout(() => {
      el.copySnippetBtn.classList.remove("is-copied");
      el.copySnippetBtn.title = "复制";
      el.copySnippetBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    }, 1200);
  });

}

wireEvents();
renderAll();