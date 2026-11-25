import { Queue, Worker, UnrecoverableError, type ConnectionOptions } from "bullmq";
import { localOnly, mode, serviceUrl } from "@drivem/config";
import type { Database } from "@drivem/db";

export type SmokeJob = { operationId: string; failOnce: boolean };
export type SmokeResult = { status: "applied" | "duplicate" };

export function redisSettings() {
  const environment = mode();
  const production = environment === "production";
  const url = serviceUrl("REDIS_URL", production ? ["rediss:"] : ["redis:", "rediss:"]);
  if (environment === "test" && url.href !== "redis://127.0.0.1:17379") {
    throw new Error("Test requires isolated Redis");
  }
  const database = url.pathname.slice(1);
  if (!/^\d*$/.test(database) || url.search || url.hash || (production && !url.password)) {
    throw new Error("Invalid REDIS_URL database or credentials");
  }
  return {
    host: url.hostname.replace(/^\[|\]$/g, ""),
    port: Number(url.port || 6379),
    db: Number(database),
    ...(url.username ? { username: decodeURIComponent(url.username) } : {}),
    ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
    ...(url.protocol === "rediss:" ? { tls: { servername: url.hostname } } : {}),
    connectTimeout: 5000,
  } satisfies ConnectionOptions;
}

const queueName = "foundation";
const prefix = () => `drivem-${mode()}`;

export function openQueue() {
  return new Queue<SmokeJob, SmokeResult, "smoke">(queueName, {
    connection: { ...redisSettings(), maxRetriesPerRequest: 1, commandTimeout: 3000, enableOfflineQueue: false },
    prefix: prefix(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 300 },
      removeOnComplete: { age: 3600, count: 500 },
      removeOnFail: { age: 86400, count: 500 },
    },
  });
}

export function startWorker(db: Database) {
  return new Worker<SmokeJob, SmokeResult, "smoke">(queueName, async (job) => {
    const { operationId, failOnce } = job.data ?? {};
    if (mode() === "production" || job.name !== "smoke" || typeof operationId !== "string" ||
        !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(operationId) ||
        typeof failOnce !== "boolean") {
      throw new UnrecoverableError("Unsupported job or invalid payload");
    }
    if (failOnce && job.attemptsMade === 0) throw new Error("Simulated transient error");

    // The effect and its idempotency key share one atomic write.
    const rows = await db`insert into crm_jobs.smoke_effects (operation_id) values (${operationId})
      on conflict (operation_id) do nothing returning operation_id`;
    return { status: rows.length ? "applied" : "duplicate" };
  }, {
    connection: { ...redisSettings(), maxRetriesPerRequest: null },
    prefix: prefix(),
    concurrency: 2,
  });
}

export async function enqueueSmoke(queue: ReturnType<typeof openQueue>, operationId: string, failOnce = false) {
  localOnly();
  return queue.add("smoke", { operationId, failOnce });
}

export async function waitForSmoke(queue: ReturnType<typeof openQueue>, job: Awaited<ReturnType<typeof enqueueSmoke>>, timeout = 15_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const current = await queue.getJob(job.id!);
    const state = await job.getState();
    if (state === "completed" && current?.returnvalue) {
      return { ...current.returnvalue, attempts: current.attemptsMade };
    }
    if (state === "failed") throw new Error("Smoke job exhausted its attempts");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Smoke job timed out");
}
