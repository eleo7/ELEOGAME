export function createInput(canvas: HTMLCanvasElement) {
  const held = new Set<string>(),
    pressed = new Set<string>();
  let aim = { x: 0, y: 0, active: false };
  const handled = [
    'w',
    'a',
    's',
    'd',
    'arrowup',
    'arrowdown',
    'arrowleft',
    'arrowright',
    ' ',
    'j',
    '1',
    '2',
    '3',
    '4',
    'e',
    'p',
    'tab',
  ];
  const down = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement)?.matches('input,select,textarea,button')) return;
    const k = e.key.toLowerCase();
    if (handled.includes(k)) e.preventDefault();
    if (!held.has(k)) pressed.add(k);
    held.add(k);
  };
  const up = (e: KeyboardEvent) => held.delete(e.key.toLowerCase());
  const blur = () => {
    held.clear();
    pressed.clear();
  };
  const click = (e: PointerEvent) => {
    if (e.button !== 0) return;
    canvas.focus();
    pressed.add('j');
  };
  const move = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    aim = {
      x: ((e.clientX - r.left) * canvas.width) / r.width,
      y: ((e.clientY - r.top) * canvas.height) / r.height,
      active: true,
    };
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', blur);
  canvas.addEventListener('pointerdown', click);
  canvas.addEventListener('pointermove', move);
  return {
    held,
    pressed,
    get aim() {
      return aim;
    },
    take(k: string) {
      const yes = pressed.has(k);
      pressed.delete(k);
      return yes;
    },
    dispose() {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      canvas.removeEventListener('pointerdown', click);
      canvas.removeEventListener('pointermove', move);
    },
  };
}
