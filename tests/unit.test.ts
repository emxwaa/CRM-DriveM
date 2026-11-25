import assert from "node:assert/strict";
import { test } from "node:test";
import { authConfig, databaseUrl, localDatabase } from "@drivem/config";
import { can, roles } from "@drivem/domain";

test("every member role can read the CRM", () => {
  for (const role of roles) assert.equal(can(role, "crm:read"), true);
});

test("only owners and admins can read business settings", () => {
  assert.deepEqual(roles.filter((role) => can(role, "settings:read")), ["owner", "admin"]);
});

test("production Auth requires a non-local HTTPS origin and secure cookies", () => {
  const env = { DRIVEM_ENV: "production", SUPABASE_ANON_KEY: "test-placeholder" };
  assert.throws(() => authConfig({ ...env, SUPABASE_URL: "http://127.0.0.1:54321" }));
  assert.throws(() => authConfig({ ...env, SUPABASE_URL: "https://auth.example.test/nested" }));
  assert.equal(authConfig({ ...env, SUPABASE_URL: "https://auth.example.test" }).secure, true);
});

test("local migrations reject production and non-local PostgreSQL", () => {
  assert.throws(() => localDatabase({ DRIVEM_ENV: "production" }), /disabled/);
  assert.throws(() => localDatabase({ DRIVEM_ENV: "test", DATABASE_MIGRATION_URL: "postgres://postgres:test-only@postgres.example.test:55322/drivem" }), /isolated PostgreSQL/);
});

test("runtime rejects admin connections and production PostgreSQL without certificate verification", () => {
  assert.throws(() => databaseUrl("DATABASE_WEB_URL", "crm_web", {
    DRIVEM_ENV: "test", DATABASE_WEB_URL: "postgres://postgres:test-only@127.0.0.1:55322/drivem",
  }), /credentials/);
  assert.throws(() => databaseUrl("DATABASE_WEB_URL", "crm_web", {
    DRIVEM_ENV: "production", DATABASE_WEB_URL: "postgres://crm_web:test-only@postgres.example.test/drivem",
  }), /TLS/);
});
