#!/usr/bin/env node
/**
 * Minimal MCP server (stdio) exposing ONE read-only tool that wraps a single
 * public HTTP endpoint. No authentication, no PII.
 *
 * Configure via environment variables (or hard-code the defaults below):
 *   BASE_URL       your site origin, e.g. https://example.com  (default below)
 *   ENDPOINT_PATH  the public read-only endpoint, e.g. /api/status
 *   TOOL_NAME      the tool name agents call (default: get_status)
 *
 * Run:    npm install && npm start
 * Verify: npm run smoke
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerExampleTool } from "./example-tool.mjs";

const BASE_URL = (process.env.BASE_URL || "https://example.com").replace(/\/+$/, "");
const ENDPOINT_PATH = process.env.ENDPOINT_PATH || "/api/status";

/** Fetch the live public endpoint. Tiny and dependency-free. */
export async function fetchData() {
  const url = `${BASE_URL}${ENDPOINT_PATH}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "agent-ready-mcp/0.1" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`${url} returned ${res.status} ${res.statusText}`);
  return res.json();
}

const server = new McpServer({ name: "agent-ready", version: "0.1.0" });
registerExampleTool(server, fetchData, () => `Source: ${BASE_URL}${ENDPOINT_PATH}`);

// Only start the stdio transport when run directly (not when imported by tests).
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr is safe for logs; stdout is reserved for the MCP protocol.
  console.error(`agent-ready MCP server running on stdio (source: ${BASE_URL}${ENDPOINT_PATH})`);
}
