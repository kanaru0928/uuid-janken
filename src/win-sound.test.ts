import { describe, expect, it } from "vite-plus/test";
import { playWinSound, type PlayableAudio } from "./win-sound";

describe("勝利SE", () => {
  it("勝者が決まったゲームでは一度だけ再生する", () => {
    let playCount = 0;
    const audio: PlayableAudio = {
      currentTime: 1,
      play: () => {
        playCount++;
        return Promise.resolve();
      },
    };

    const hasPlayed = playWinSound(audio, false);
    playWinSound(audio, hasPlayed);

    expect(audio.currentTime).toBe(0);
    expect(playCount).toBe(1);
  });
});
