# agent-ready-starter

**Make your site discoverable and usable by AI agents in about 30 minutes.**

AI agents (ChatGPT, Claude, Perplexity, and a growing wave of task-runners that *act* on your
behalf) increasingly read and use sites without a human ever loading the page. To be found and
used by them you need three small, machine-readable things:

1. **`llms.txt`** — a plain-text map at your site root that tells an agent what you are and where
   your machine-readable data lives. *(discovery)*
2. **`openapi.yaml`** — a standard spec describing your public, read-only endpoints so an agent
   can call them, not just read about them. *(capability)*
3. **An MCP server** — a tiny [Model Context Protocol](https://modelcontextprotocol.io) server
   that exposes one of those endpoints as a tool an agent can invoke directly. *(integration)*

This repo gives you all three as copy-paste templates plus a one-command generator. It is not a
SaaS, a crawler, or an SEO tool — it makes your site *legible to machines*. You edit one config
file and ship.

---

## Quickstart (~30 min)

> Prereqs: Node 18+, and a public endpoint that returns JSON (even a tiny `{"asOf": "..."}` is
> fine to start). No endpoint yet? Add a trivial read-only one first — agents need something to call.

### 1. Get the files (2 min)

```bash
git clone https://github.com/<you>/agent-ready-starter.git
cd agent-ready-starter
```

### 2. Fill in your details (5 min)

```bash
cp config.example.json config.json
```

Edit `config.json` — it's the only file you have to touch:

- `siteName`, `siteUrl`, `oneLiner`, `operator`
- `endpoint` — the public read-only endpoint you want agents to discover (path, summary, description)
- `mcpTool` — the name/description of the tool your MCP server exposes

### 3. Generate `llms.txt` + `openapi.yaml` (1 min)

```bash
node scripts/generate.mjs
```

This writes `public/llms.txt` and `public/openapi.yaml` with your values filled in.

### 4. Serve them at your domain root (10 min)

Deploy the two files so they resolve at the root of your domain:

- `https://yourdomain/llms.txt`
- `https://yourdomain/openapi.yaml`

Most frameworks serve a `public/` (or `static/`) folder at the root automatically (Next.js,
Vite, Astro, Express static, Cloudflare Pages, Netlify, …). Drop the generated files there and
deploy. **Verify both return `200` with the right `Content-Type` (`text/plain` and `text/yaml`),
not your app's 404 page** — a static file that 404s usually means it wasn't included in the deploy.

### 5. Stand up the MCP server (10 min)

```bash
cd mcp
npm install
BASE_URL=https://yourdomain ENDPOINT_PATH=/your/endpoint npm run smoke
```

A green `PASS` with your live data means an agent can now discover (`llms.txt`), understand
(`openapi.yaml`), and call (MCP) your site. See [`mcp/README.md`](mcp/README.md) to wire it into
Claude Desktop or host it remotely.

---

## You're agent-ready when…

- [ ] `https://yourdomain/llms.txt` returns `200` as `text/plain` with your real content.
- [ ] `https://yourdomain/openapi.yaml` returns `200` as `text/yaml` and validates.
- [ ] The endpoint named in both actually returns JSON with no auth.
- [ ] `npm run smoke` in `mcp/` prints `PASS` against your live endpoint.
- [ ] `llms.txt` only points at **read-only, non-personal** data (no auth, no PII).
- [ ] You can paste your `llms.txt` URL to an agent and it can explain and call your endpoint.
- [ ] *(advanced, optional)* If you serve a static site that can't run an MCP server, consider the
  emerging `.well-known` agent feeds — `mcp.llmfeed.json` (LLMFeed) and `agentdir.json`. These are
  **draft/experimental** specs, not required for v0, but they're where static-host discovery is heading.

---

## What's in here

```
agent-ready-starter/
├─ config.example.json     # copy to config.json — the only file you edit
├─ templates/
│  ├─ llms.txt             # discovery template ({{TOKENS}})
│  └─ openapi.yaml         # capability template ({{TOKENS}})
├─ scripts/
│  └─ generate.mjs         # fills templates from config.json -> public/
├─ public/                 # generated; serve at your domain root
└─ mcp/                    # integration: a stdio MCP server + smoke test
   ├─ index.js
   ├─ example-tool.mjs     # one transport-agnostic, read-only tool
   ├─ smoke-test.js
   └─ README.md
```

## Scope & support

v0 covers the **read-only discovery + one callable tool** path — the 80% that gets you found and
used. Paid/authenticated tools, metering, and remote hosting are deliberately out of scope here
(the MCP tool contract is written to extend to them later — see `mcp/README.md`).

**Maintenance:** the `llms.txt` and MCP specs move, so this template is reviewed against them
**roughly quarterly** and patched when something breaks — **best-effort, no SLA.** Open an issue
for anything broken; that's the fastest way to get it fixed. Want it set up and verified *for*
you, or kept current as the specs change? That's a separate paid service.

## License

MIT — see [LICENSE](LICENSE).
