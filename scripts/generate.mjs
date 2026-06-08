#!/usr/bin/env node
/**
 * Fill the templates in templates/ with values from config.json and write the
 * result to public/. Run after editing config.json:
 *
 *   node scripts/generate.mjs
 *
 * Then serve public/ at your site root so /llms.txt and /openapi.yaml resolve.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = join(root, "config.json");

if (!existsSync(configPath)) {
  console.error("No config.json found. Copy config.example.json -> config.json and edit it first.");
  process.exit(1);
}

const cfg = JSON.parse(readFileSync(configPath, "utf8"));

const tokens = {
  SITE_NAME: cfg.siteName,
  SITE_URL: String(cfg.siteUrl || "").replace(/\/+$/, ""),
  ONE_LINER: cfg.oneLiner,
  OPERATOR: cfg.operator,
  ENDPOINT_PATH: cfg.endpoint?.path,
  ENDPOINT_OPERATION_ID: cfg.endpoint?.operationId,
  ENDPOINT_SUMMARY: cfg.endpoint?.summary,
  ENDPOINT_DESCRIPTION: cfg.endpoint?.description,
  TOOL_NAME: cfg.mcpTool?.name,
  TOOL_TITLE: cfg.mcpTool?.title,
  TOOL_DESCRIPTION: cfg.mcpTool?.description,
};

function render(tpl, file) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_m, key) => {
    if (tokens[key] == null || tokens[key] === "") {
      console.error(`Missing value for {{${key}}} (needed by ${file}). Check config.json.`);
      process.exit(1);
    }
    return tokens[key];
  });
}

mkdirSync(join(root, "public"), { recursive: true });
for (const name of ["llms.txt", "openapi.yaml"]) {
  const tpl = readFileSync(join(root, "templates", name), "utf8");
  writeFileSync(join(root, "public", name), render(tpl, name));
  console.log(`wrote public/${name}`);
}
console.log("\nDone. Serve public/ at your site root so /llms.txt and /openapi.yaml resolve at the domain root.");
