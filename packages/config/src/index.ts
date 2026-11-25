export function required(name: string, env = process.env): string {
  const value = env[name]?.trim();
  if (!value || value.length > 4096) throw new Error(`Missing or invalid configuration: ${name}`);
  return value;
}

export function mode(env = process.env) {
  const value = required("DRIVEM_ENV", env);
  if (value !== "development" && value !== "test" && value !== "production") {
    throw new Error("Invalid DRIVEM_ENV");
  }
  return value;
}

export function serviceUrl(name: string, protocols: readonly string[], env = process.env): URL {
  let url: URL;
  try {
    url = new URL(required(name, env));
  } catch {
    throw new Error(`Invalid URL configuration: ${name}`);
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (!protocols.includes(url.protocol) || (mode(env) === "production" && local)) {
    throw new Error(`Disallowed service URL: ${name}`);
  }
  return url;
}

export function authConfig(env = process.env) {
  const environment = mode(env);
  const local = environment !== "production";
  const url = serviceUrl("SUPABASE_URL", local ? ["http:", "https:"] : ["https:"], env);
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Invalid SUPABASE_URL origin");
  }
  if (url.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error("Unencrypted Auth requires loopback");
  }
  if (environment === "test" && url.origin !== "http://127.0.0.1:55321") throw new Error("Test requires isolated Auth");
  return { url: url.origin, key: required("SUPABASE_ANON_KEY", env), secure: url.protocol === "https:" };
}

export function localOnly(env = process.env) {
  if (mode(env) === "production") throw new Error("Local operation disabled in production");
}

export function databaseUrl(name: string, username: string, env = process.env): string {
  const url = serviceUrl(name, ["postgres:", "postgresql:"], env);
  if (url.username !== username || !url.password) throw new Error(`Invalid PostgreSQL credentials: ${name}`);
  const environment = mode(env);
  if (environment === "test" && (url.hostname !== "127.0.0.1" || url.port !== "55322" || url.pathname !== "/drivem" || url.search || url.hash)) {
    throw new Error("Test requires isolated PostgreSQL");
  }
  if (environment === "production" && url.searchParams.get("sslmode") !== "verify-full") {
    throw new Error(`Verified PostgreSQL TLS required: ${name}`);
  }
  return url.href;
}

export function localDatabase(env = process.env) {
  localOnly(env);
  const url = new URL(databaseUrl("DATABASE_MIGRATION_URL", "postgres", env));
  if (url.hostname !== "127.0.0.1" || url.port !== (mode(env) === "test" ? "55322" : "54322") || url.pathname !== "/drivem" || url.search || url.hash) {
    throw new Error("Migration requires the local Compose database");
  }
  return url.href;
}
