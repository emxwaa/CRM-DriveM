// Runtime processes receive only their assigned DriveM configuration.
const allowed = {
  web: ["DRIVEM_ENV", "SUPABASE_URL", "SUPABASE_ANON_KEY", "DATABASE_WEB_URL"],
  worker: ["DRIVEM_ENV", "REDIS_URL", "DATABASE_WORKER_URL", "WORKER_HEALTH_PORT"],
};
const provisioning = [
  "DATABASE_MIGRATION_URL", "SUPABASE_SERVICE_ROLE_KEY", "GOTRUE_JWT_SECRET",
  "GOTRUE_DB_PASSWORD", "POSTGRES_PASSWORD", "WEB_DB_PASSWORD", "WORKER_DB_PASSWORD",
  "LOCAL_AUTH_PORT", "LOCAL_REDIS_PORT", "LOCAL_POSTGRES_PORT",
];

export function serviceEnv(service, source) {
  const other = service === "web" ? "worker" : "web";
  const denied = new Set([...provisioning, ...allowed[other].filter((name) => !allowed[service].includes(name))]);
  return Object.fromEntries(Object.entries(source).filter(([name]) => !denied.has(name)));
}
