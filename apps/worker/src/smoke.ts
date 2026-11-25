import { randomUUID } from "node:crypto";
import { localOnly } from "@drivem/config";
import { openQueue, enqueueSmoke, waitForSmoke } from "./jobs";

try {
  localOnly();
  const queue = openQueue();
  queue.on("error", () => console.error("queue.connection_error"));
  try {
    const operation = randomUUID();
    const first = await waitForSmoke(queue, await enqueueSmoke(queue, operation, true));
    const duplicate = await waitForSmoke(queue, await enqueueSmoke(queue, operation));
    if (first.status !== "applied" || first.attempts !== 2 || duplicate.status !== "duplicate") {
      throw new Error("Unexpected smoke outcome");
    }
    console.log({ first, duplicate });
  } finally {
    await queue.close();
  }
} catch {
  console.error("Тест черги не завершено. Перевірте Redis, воркер і міграції.");
  process.exitCode = 1;
}
