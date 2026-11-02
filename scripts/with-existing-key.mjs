// Pass only the selected existing API key to a child; never write or display it.
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { spawn } from "node:child_process";
const modes = { dev: ["run", "dev"], verify: ["run", "verify:ai"], generate: ["run", "generate:ai-demo"], wire: ["run", "verify:ai:wire"] };
const [mode, file] = process.argv.slice(2);
if (!Object.hasOwn(modes, mode) || !file) {
  console.error("Usage: node scripts/with-existing-key.mjs dev|verify|generate|wire <existing-env-file>");
  process.exit(1);
}
let key;
try { key = parseEnv(readFileSync(file, "utf8")).OPENAI_API_KEY; } catch { /* secret-free error below */ }
if (!key || !key.startsWith("sk-")) { console.error("An existing OPENAI_API_KEY could not be loaded."); process.exit(1); }
const child = spawn("npm", modes[mode], { stdio: "inherit", shell: false,
  env: { ...process.env, OPENAI_API_KEY: key, KSAFE_AI_ENABLED: "true" } });
for (const event of ["SIGINT", "SIGTERM"]) process.on(event, () => child.kill(event));
child.on("error", () => { console.error("Could not start the requested task."); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
