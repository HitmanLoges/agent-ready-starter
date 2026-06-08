#!/usr/bin/env node
/**
 * Smoke test: spawn the MCP server over stdio, list its tools, and call the
 * read-only tool against your live endpoint. Exits non-zero on any failure.
 *
 * Set BASE_URL / ENDPOINT_PATH / TOOL_NAME to match your site first, e.g.:
 *   BASE_URL=https://example.com ENDPOINT_PATH=/api/status npm run smoke
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const TOOL_NAME = process.env.TOOL_NAME || "get_status";

const transport = new StdioClientTransport({
  command: "node",
  args: ["index.js"],
  env: { ...process.env },
});
const client = new Client({ name: "smoke-test", version: "0.0.0" });
await client.connect(transport);

const { tools } = await client.listTools();
console.log("Tools exposed:", tools.map((t) => t.name).join(", "));
if (!tools.find((t) => t.name === TOOL_NAME)) {
  console.error(`FAIL: ${TOOL_NAME} not registered`);
  process.exit(1);
}

const result = await client.callTool({ name: TOOL_NAME, arguments: {} });
if (result.isError) {
  console.error("FAIL: tool returned error:", JSON.stringify(result.content));
  process.exit(1);
}
console.log("\n--- tool output ---");
for (const c of result.content) console.log(c.text);

await client.close();
console.log("\nPASS");
process.exit(0);
