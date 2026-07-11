// Runs in a dedicated Worker. Spins on a shared "go" flag so both race
// workers are released from the barrier at (as close to) the same instant,
// then immediately posts a result message — the race is decided by whose
// message reaches the main thread first. The main thread (see race.ts)
// issues a v7 UUID on the spot as each result arrives, so the earlier
// arrival gets the earlier-generated (lower-sorting) UUID.

type InitMessage = { type: "init"; sab: SharedArrayBuffer };
type RoundMessage = { type: "round" };
type InMessage = InitMessage | RoundMessage;

const GO = 0;

let view: Int32Array | null = null;

self.onmessage = (e: MessageEvent<InMessage>) => {
  const msg = e.data;

  if (msg.type === "init") {
    view = new Int32Array(msg.sab);
    return;
  }

  if (msg.type === "round" && view) {
    postMessage({ type: "ready" });
    while (Atomics.load(view, GO) !== 1) {
      // busy spin until the main thread releases the barrier
    }
    postMessage({ type: "result" });
  }
};
