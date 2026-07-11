// Decides which player's UUID v7 wins by actually racing two Worker threads
// (see race-worker.ts), instead of a coin-flip RNG bit. This makes the
// outcome depend on real OS thread scheduling, which was measured (in a
// throwaway node:worker_threads prototype, not part of this test suite) to
// be only approximately fair — occasionally biased well outside sampling
// noise. That tradeoff (genuine race over guaranteed fairness) was a
// deliberate, user-confirmed choice.
export const RACE_SUPPORTED =
  typeof SharedArrayBuffer !== "undefined" &&
  typeof crossOriginIsolated !== "undefined" &&
  crossOriginIsolated;

const GO = 0;
const COUNTER = 1;

let workerA: Worker | null = null;
let workerB: Worker | null = null;
let view: Int32Array | null = null;

function ensureWorkers(): void {
  if (workerA && workerB && view) return;

  const sab = new SharedArrayBuffer(8);
  view = new Int32Array(sab);
  workerA = new Worker(new URL("./race-worker.ts", import.meta.url), { type: "module" });
  workerB = new Worker(new URL("./race-worker.ts", import.meta.url), { type: "module" });
  workerA.postMessage({ type: "init", sab });
  workerB.postMessage({ type: "init", sab });
}

function runRound(): Promise<{ aWon: boolean }> {
  const a = workerA!;
  const b = workerB!;
  const v = view!;

  return new Promise((resolve) => {
    Atomics.store(v, GO, 0);
    Atomics.store(v, COUNTER, 0);

    let readyCount = 0;
    let seqA = -1;
    let doneCount = 0;

    const onMessageFrom = (who: "a" | "b") => (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === "ready") {
        readyCount++;
        if (readyCount === 2) Atomics.store(v, GO, 1);
      } else if (msg.type === "result") {
        if (who === "a") seqA = msg.seq;
        doneCount++;
        if (doneCount === 2) {
          a.removeEventListener("message", handlerA);
          b.removeEventListener("message", handlerB);
          resolve({ aWon: seqA === 0 });
        }
      }
    };
    const handlerA = onMessageFrom("a");
    const handlerB = onMessageFrom("b");
    a.addEventListener("message", handlerA);
    b.addEventListener("message", handlerB);
    a.postMessage({ type: "round" });
    b.postMessage({ type: "round" });
  });
}

// Returns whether "player 0" wins the race. Falls back to a fair coin flip
// when SharedArrayBuffer/cross-origin isolation isn't available, so v7 play
// still works on hosts without the COOP/COEP headers set.
export async function racePlayer0Wins(): Promise<boolean> {
  if (!RACE_SUPPORTED) {
    return Math.random() < 0.5;
  }

  ensureWorkers();
  const { aWon } = await runRound();
  // Randomize which physical worker stands in for which player each round —
  // the prototype showed hardware scheduling bias can be consistent, so a
  // fixed worker-to-player mapping would let it consistently favor one seat.
  const aIsPlayer0 = Math.random() < 0.5;
  return aIsPlayer0 ? aWon : !aWon;
}
