import { prisma } from "@/lib/prisma";

/**
 * The admin pages fire many queries at once (an overview alone needs a dozen).
 * The connection pool is small, so a burst can time out with "Timed out fetching a
 * new connection from the connection pool". This wrapper lets only a few admin
 * queries run at a time and queues the rest, leaving connections for donors.
 *
 * Use it exactly like prisma: `import { adb as prisma } from "@/lib/admin/db"`.
 */
const MAX_CONCURRENT = 4;

let active = 0;
const waiting: Array<() => void> = [];

function run<T>(task: () => PromiseLike<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const start = () => {
      active++;
      Promise.resolve()
        .then(task)
        .then(resolve, reject)
        .finally(() => {
          active--;
          waiting.shift()?.();
        });
    };
    if (active < MAX_CONCURRENT) start();
    else waiting.push(start);
  });
}

type AnyFn = (...args: unknown[]) => unknown;

function limitedModel(model: Record<string, unknown>) {
  return new Proxy(model, {
    get(target, prop) {
      const value = target[prop as string];
      if (typeof value !== "function") return value;
      return (...args: unknown[]) => run(() => (value as AnyFn).apply(target, args) as PromiseLike<unknown>);
    },
  });
}

export const adb = new Proxy(prisma as unknown as Record<string, unknown>, {
  get(target, prop) {
    const value = target[prop as string];
    if (typeof prop === "string" && prop.startsWith("$")) {
      // $queryRaw, $executeRaw and friends. Not transactions: those hold a connection themselves.
      if (typeof value !== "function") return value;
      return (...args: unknown[]) => run(() => (value as AnyFn).apply(target, args) as PromiseLike<unknown>);
    }
    // A model delegate such as prisma.user
    return value && typeof value === "object" ? limitedModel(value as Record<string, unknown>) : value;
  },
}) as unknown as typeof prisma;
