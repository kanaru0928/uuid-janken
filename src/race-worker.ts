// Runs in a dedicated Worker. Spins on a shared "go" flag so both race
// workers are released from the barrier at (as close to) the same instant,
// then fetch-and-adds a shared counter — whichever worker's add executes
// first gets 0. See race.ts for the main-thread side of the protocol.

type InitMessage = { type: "init"; sab: SharedArrayBuffer };
type RoundMessage = { type: "round" };
type InMessage = InitMessage | RoundMessage;

const GO = 0;
const COUNTER = 1;

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
    const seq = Atomics.add(view, COUNTER, 1); // fetch-and-add: first caller gets 0
    postMessage({ type: "result", seq });
  }
};
