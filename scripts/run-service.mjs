import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";
import { serviceEnv } from "./service-env.mjs";

const command = process.argv[2];
const worker = command === "worker";
if (!worker && command !== "dev" && command !== "start") throw new Error("Unknown DriveM process");
let config = process.env;
if (config.DRIVEM_ENV !== "production") {
  const file = config.DRIVEM_ENV === "test" ? ".env.test" : ".env";
  try {
    config = { ...parseEnv(readFileSync(file, "utf8")), ...config };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    console.error("Запустіть pnpm env:init і pnpm infra:up.");
    process.exit(1);
  }
}
const cwd = worker ? process.cwd() : resolve("apps/web");
const args = worker
  ? ["--import", "tsx", "apps/worker/src/main.ts"]
  : [resolve("node_modules/next/dist/bin/next"), command, "--hostname", "127.0.0.1", ...process.argv.slice(3)];
const child = spawn(process.execPath, args, {
  cwd, stdio: "inherit", env: serviceEnv(worker ? "worker" : "web", config),
});
child.on("error", () => { console.error("Не вдалося запустити процес."); process.exitCode = 1; });
child.on("exit", (code, signal) => { process.exitCode = code ?? (signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 1); });
process.once("SIGINT", () => child.kill("SIGINT"));
process.once("SIGTERM", () => child.kill("SIGTERM"));
