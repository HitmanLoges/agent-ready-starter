/**
 * Transport-agnostic definition of ONE read-only tool.
 *
 * Dependency-free on purpose — it only touches the `server` object passed in,
 * so the same contract can be registered on a stdio server and (later) a remote
 * Streamable-HTTP server without the tool name or output formatting drifting.
 *
 * To adapt: rename the tool via the TOOL_NAME env var (or edit the default),
 * tweak TOOL_CONFIG.description, and customise formatResponse() for your payload.
 */

export const TOOL_NAME = process.env.TOOL_NAME || "get_status";

export const TOOL_CONFIG = {
  title: process.env.TOOL_TITLE || "Get public status",
  description:
    process.env.TOOL_DESCRIPTION ||
    "Returns the site's public, read-only aggregate data. " +
      "Read-only, no authentication, aggregate (non-personal) data only.",
  // Empty input schema = the tool takes no arguments. Add fields here if needed.
  inputSchema: {},
  // NO outputSchema on purpose. If you add one, you MUST also return a
  // `structuredContent` object from the handler below (see the AFTER block),
  // or spec-compliant clients (Cursor, Claude) reject every tools/call with
  // -32600 while the server still answers 200 — a silent, prod-down break.
  // The smoke test asserts this contract for you. Contract per MCP spec
  // 2025-06-18; failure mode documented at app.pushrealm.com/learning/501.
};

/** Render a raw response object into a short, agent-readable text block. */
export function formatResponse(data) {
  const fmt = (v) => (typeof v === "number" ? v.toLocaleString("en-US") : String(v));
  const asOf = data.asOf ?? new Date().toISOString();
  const lines = Object.entries(data)
    .filter(([k]) => k !== "asOf")
    .map(([k, v]) => `- ${k}: ${fmt(v)}`);
  return [`Public data (as of ${asOf}):`, ...lines].join("\n");
}

/**
 * Register the read-only tool on an McpServer instance.
 * @param {object} server - an McpServer
 * @param {() => Promise<object>} fetchData - returns the raw response object
 * @param {(data: object) => string} [sourceNote] - optional extra source line
 */
export function registerExampleTool(server, fetchData, sourceNote) {
  server.registerTool(TOOL_NAME, TOOL_CONFIG, async () => {
    try {
      const data = await fetchData();
      const extra = sourceNote ? `${sourceNote(data)}\n` : "";
      return {
        content: [
          { type: "text", text: formatResponse(data) },
          { type: "text", text: `${extra}Raw JSON:\n${JSON.stringify(data, null, 2)}` },
        ],
        // If you add an `outputSchema` to TOOL_CONFIG, uncomment the next line
        // so the result carries the structured object compliant clients require:
        // structuredContent: data,
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Failed to fetch data: ${err.message}` }],
      };
    }
  });
}
