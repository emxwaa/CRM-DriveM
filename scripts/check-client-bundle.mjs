import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const root = new URL("../apps/web/.next/static/", import.meta.url);
const filenames = (await readdir(root, { recursive: true })).filter((name) => /\.(js|css|map)$/.test(name));
assert.ok(filenames.length, "Production browser assets missing");
const keys = ["DATABASE_WEB_URL", "DATABASE_WORKER_URL", "DATABASE_MIGRATION_URL", "SUPABASE_SERVICE_ROLE_KEY", "GOTRUE_JWT_SECRET"];
for (const name of keys) assert.ok(process.env[name], `Missing test canary ${name}`);
for (const file of filenames) {
  const data = await readFile(new URL(file, root), "utf8");
  for (const key of keys) assert.ok(!data.includes(process.env[key]), `Client bundle contains ${key} in ${file}`);
}
console.log(`Перевірено ${filenames.length} клієнтських файлів і ${keys.length} секретних змінних.`);
