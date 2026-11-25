import { createHmac, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const mode = process.argv[2] ?? "development";
if (!["development", "test"].includes(mode)) throw new Error("Use development or test");
const random = () => randomBytes(32).toString("hex");
const pg = random();
const web = random();
const worker = random();
const auth = random();
const jwt = random();
function token(role) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const body = encode({ alg: "HS256", typ: "JWT" }) + "." + encode({ role, iss: "supabase", iat: now, exp: now + 365 * 86400 });
  return body + "." + createHmac("sha256", jwt).update(body).digest("base64url");
}
const ports = mode === "test" ? { pg: 55322, redis: 17379, auth: 55321, worker: 3102 } : { pg: 54322, redis: 16379, auth: 54321, worker: 3101 };
const url = (user, password) => `postgres://${user}:${password}@127.0.0.1:${ports.pg}/drivem`;
const values = {
  LOCAL_POSTGRES_PORT: ports.pg, LOCAL_REDIS_PORT: ports.redis, LOCAL_AUTH_PORT: ports.auth,
  REDIS_URL: `redis://127.0.0.1:${ports.redis}`, SUPABASE_URL: `http://127.0.0.1:${ports.auth}`,
  WORKER_HEALTH_PORT: ports.worker, DRIVEM_ENV: mode, POSTGRES_PASSWORD: pg, WEB_DB_PASSWORD: web, WORKER_DB_PASSWORD: worker,
  GOTRUE_DB_PASSWORD: auth, GOTRUE_JWT_SECRET: jwt,
  DATABASE_MIGRATION_URL: url("postgres", pg), DATABASE_WEB_URL: url("crm_web", web),
  DATABASE_WORKER_URL: url("crm_worker", worker), SUPABASE_ANON_KEY: token("anon"),
  SUPABASE_SERVICE_ROLE_KEY: token("service_role"),
};
const template = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
const result = template.replace(/^([A-Z_]+)=.*$/gm, (line, key) => Object.hasOwn(values, key) ? `${key}=${values[key]}` : line);
try {
  writeFileSync(new URL(mode === "test" ? "../.env.test" : "../.env", import.meta.url), result, { flag: "wx", mode: 0o600 });
  console.log("Створено файл локальної конфігурації");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.log("Використовується наявна локальна конфігурація");
}
