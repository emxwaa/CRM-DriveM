import { spawnSync } from "node:child_process";

process.loadEnvFile(".env.test");
if (process.env.DRIVEM_ENV !== "test") throw new Error("Expected test build configuration");
const build = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build", "apps/web"], { stdio: "inherit" });
if (build.error) throw build.error;
process.exitCode = build.status ?? 1;
