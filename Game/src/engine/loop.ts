import { B } from '../data/balance';
export function fixedLoop(update: (dt: number) => void, draw: () => void) {
  let running = true,
    last = performance.now(),
    acc = 0,
    raf = 0;
  const loop = (now: number) => {
    if (!running) return;
    acc += Math.min(B.maxFrame, (now - last) / 1000);
    last = now;
    while (acc >= B.fixedStep) {
      update(B.fixedStep);
      acc -= B.fixedStep;
    }
    draw();
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => {
    running = false;
    cancelAnimationFrame(raf);
  };
}
