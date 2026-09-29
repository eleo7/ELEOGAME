let context: AudioContext | undefined;
export function sound(kind: 'hit' | 'magic' | 'level', volume: number) {
  if (volume <= 0) return;
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume();
    const osc = context.createOscillator(),
      gain = context.createGain();
    osc.type = kind === 'magic' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(
      kind === 'level' ? 520 : kind === 'magic' ? 360 : 170,
      context.currentTime,
    );
    osc.frequency.exponentialRampToValueAtTime(
      kind === 'level' ? 880 : 60,
      context.currentTime + 0.17,
    );
    gain.gain.setValueAtTime(volume * 0.12, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
    osc.connect(gain).connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 0.21);
  } catch {
    /* Audio is optional when the browser denies an audio context. */
  }
}
