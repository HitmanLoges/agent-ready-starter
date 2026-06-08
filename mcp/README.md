# MCP server

A minimal [Model Context Protocol](https://modelcontextprotocol.io) server that exposes ONE
read-only public endpoint as a tool agents can call. No authentication, no PII — aggregate data only.

## Configure

Point it at your site with environment variables (or edit the defaults in `index.js`):

| Var | Example | Default |
|-----|---------|---------|
| `BASE_URL` | `https://example.com` | `https://example.com` |
| `ENDPOINT_PATH` | `/api/status` | `/api/status` |
| `TOOL_NAME` | `get_status` | `get_status` |

## Run

```bash
npm install
npm start          # launches the stdio server
```

## Verify

```bash
npm run smoke      # spawns the server, lists tools, calls the tool, prints output
```

## Use from an MCP client (e.g. Claude Desktop)

Add to the client's MCP config, pointing at this directory:

```json
{
  "mcpServers": {
    "agent-ready": {
      "command": "node",
      "args": ["/absolute/path/to/agent-ready-starter/mcp/index.js"],
      "env": { "BASE_URL": "https://example.com", "ENDPOINT_PATH": "/api/status" }
    }
  }
}
```

## Going remote (optional, phase 2)

stdio works for local clients. To let off-machine agents reach the tool, host the same
contract (`example-tool.mjs`) behind a Streamable-HTTP transport on a small server, expose it at
`https://yourdomain/mcp`, and advertise that URL in your `llms.txt`. The tool contract is
transport-agnostic by design, so you register the identical `registerExampleTool` on both.
