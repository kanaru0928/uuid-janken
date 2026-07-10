export interface PlayableAudio {
  currentTime: number;
  play: () => Promise<void>;
}

export function playWinSound(audio: PlayableAudio, hasPlayed: boolean): boolean {
  if (hasPlayed) return true;

  audio.currentTime = 0;
  void audio.play().catch(() => undefined);
  return true;
}
