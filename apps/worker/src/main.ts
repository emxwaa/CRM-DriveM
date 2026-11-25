import { createServer } from "node:http";
import { databaseUrl, required } from "@drivem/config";
import { connect } from "@drivem/db";
import { openQueue, startWorker } from "./jobs";

async function main() {
  const port = Number(required("WORKER_HEALTH_PORT"));
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Invalid worker health port");
  const db = connect(databaseUrl("DATABASE_WORKER_URL", "crm_worker"), 3);
  const worker = startWorker(db);
  const queue = openQueue();
  queue.on("error", () => console.error("worker.health_redis_error"));
  let stopping = false;

  let nextConnectionLog = 0;
  worker.on("error", () => {
    if (Date.now() < nextConnectionLog) return;
    nextConnectionLog = Date.now() + 10_000;
    console.error("worker.connection_error");
  });
  worker.on("failed", (job) => console.warn("worker.job_failed", { attempt: job?.attemptsMade }));
  worker.on("completed", (_job, result) => console.info("worker.job_completed", { status: result.status }));

  const server = createServer(async (request, response) => {
    if (request.method !== "GET" || request.url !== "/health") {
      response.writeHead(404).end();
      return;
    }
    try {
      if (stopping || !worker.isRunning()) throw new Error("Worker not running");
      await Promise.all([queue.getJobCounts("waiting"), db`select 1 from crm_jobs.smoke_effects limit 0`]);
      response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end('{"status":"ok"}');
    } catch {
      response.writeHead(503, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end('{"status":"unavailable"}');
    }
  });
  const stop = async (code: number) => {
    if (stopping) return;
    stopping = true;
    const limit = setTimeout(() => process.exit(1), 20_000).unref();
    try {
      server.close();
      await worker.close();
      await queue.close();
      await db.end({ timeout: 5 });
      process.exitCode = code;
    } catch {
      process.exitCode = 1;
    } finally {
      clearTimeout(limit);
    }
  };
  process.once("SIGINT", () => void stop(0));
  process.once("SIGTERM", () => void stop(0));
  server.on("error", () => {
    console.error("worker.health_listener_error");
    void stop(1);
  });
  server.listen(port, "127.0.0.1", () => console.info("worker.started"));
}

main().catch(() => {
  console.error("worker.startup_failed");
  process.exitCode = 1;
});
