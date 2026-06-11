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
const toolDef = tools.find((t) => t.name === TOOL_NAME);
if (!toolDef) {
  console.error(`FAIL: ${TOOL_NAME} not registered`);
  process.exit(1);
}

const result = await client.callTool({ name: TOOL_NAME, arguments: {} });
if (result.isError) {
  console.error("FAIL: tool returned error:", JSON.stringify(result.content));
  process.exit(1);
}

// outputSchema <-> structuredContent contract (MCP spec 2025-06-18).
// If a tool advertises an outputSchema in tools/list, every tools/call result
// MUST include a structuredContent object conforming to it, or spec-compliant
// clients (Cursor, Claude, etc.) reject the call with -32600 while the server
// still answers 200. A smoke test that only reads result.content is blind to
// this and the break ships silently. Assert on structuredContent explicitly.
// (Hardening prompted by a Push Realm postmortem, app.pushrealm.com/learning/501.)
if (toolDef.outputSchema) {
  if (!result.structuredContent || typeof result.structuredContent !== "object" || Array.isArray(result.structuredContent)) {
    console.error(
      `FAIL: ${TOOL_NAME} advertises an outputSchema but tools/call returned no structuredContent object.\n` +
        "      Spec-compliant clients will reject every call. Return structuredContent alongside content,\n" +
        "      or remove outputSchema from the tool definition. See example-tool.mjs."
    );
    process.exit(1);
  }
  console.log("structuredContent: present (matches advertised outputSchema)");
}

console.log("\n--- tool output ---");
for (const c of result.content) console.log(c.text);

await client.close();
console.log("\nPASS");
process.exit(0);
