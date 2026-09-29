import { raceById } from '../data/races';
import type { Character } from '../state/types';
export function drawHero(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  c: Character,
  frame = 0,
  scale = 1,
  facing = 1,
) {
  const r = raceById(c.race);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale * facing, scale);
  const p = (a: number, b: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(a, b, w, h);
  };
  ctx.fillStyle = '#0005';
  ctx.beginPath();
  ctx.ellipse(0, 2, 9, 3, 0, 0, 7);
  ctx.fill();
  if (c.tier || c.awakened) {
    ctx.strokeStyle = c.awakened ? '#f3df9c' : r.color;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12 + c.tier, 5, 0, 0, 7);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  const step = Math.sin(frame) * 2;
  p(-6, -5, 5, 7 + step, '#30323c');
  p(2, -5, 5, 7 - step, '#30323c');
  p(-7, 0 + step, 6, 3, '#a88d6e');
  p(2, -step, 6, 3, '#a88d6e');
  p(-8, -17, 16, 13, r.color);
  p(-5, -17, 10, 3, '#c6cfb4');
  p(-8, -8, 16, 3, '#614e45');
  p(-1, -8, 3, 3, '#e8cf80');
  p(-10, -16, 4, 10, r.skin);
  p(7, -15, 4, 9, r.skin);
  p(-7, -29, 14, 13, r.skin);
  p(-8, -30, 16, 5, c.race === 'race-4' ? '#e3d2a4' : '#4f413f');
  p(-8, -25, 3, 5, '#4f413f');
  p(-4, -22, 2, 2, '#222832');
  p(3, -22, 2, 2, '#222832');
  p(-1, -18, 3, 1, '#b78271');
  if (r.name.includes('Elfo') || r.name === 'Elfo') {
    p(-11, -24, 4, 4, r.skin);
    p(7, -24, 4, 4, r.skin);
  }
  if (r.name === 'Orc' || r.name === 'Draconiano') {
    p(-7, -32, 3, 5, '#dfd6bc');
    p(4, -32, 3, 5, '#dfd6bc');
  }
  p(12, -21, 2, 19, '#cbd9db');
  p(11, -22, 4, 3, '#e5eff0');
  p(9, -5, 8, 2, '#c5a362');
  p(12, -3, 2, 5, '#796449');
  ctx.restore();
}
export function drawTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size = 1,
  color = '#345d49',
) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(size, size);
  ctx.fillStyle = '#0a181c66';
  ctx.fillRect(-9, -1, 21, 5);
  ctx.fillStyle = '#665540';
  ctx.fillRect(-2, -10, 4, 13);
  ctx.fillStyle = '#203d34';
  ctx.fillRect(-10, -20, 20, 14);
  ctx.fillStyle = color;
  ctx.fillRect(-12, -25, 24, 13);
  ctx.fillRect(-9, -31, 18, 10);
  ctx.fillRect(-5, -35, 10, 5);
  ctx.fillStyle = '#ffffff0b';
  ctx.fillRect(-7, -29, 5, 8);
  ctx.fillRect(-10, -22, 8, 3);
  ctx.restore();
}
export function drawMonster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: string,
  time: number,
  boss = false,
) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  const s = boss ? 1.9 : 1;
  ctx.scale(s, s);
  ctx.fillStyle = '#0005';
  ctx.beginPath();
  ctx.ellipse(0, 1, 10, 4, 0, 0, 7);
  ctx.fill();
  const bounce = Math.sin(time * 4) * 1.5;
  ctx.translate(0, bounce);
  if (type === 'slime') {
    ctx.fillStyle = '#48766b';
    ctx.fillRect(-10, -10, 20, 9);
    ctx.fillStyle = '#82bc85';
    ctx.fillRect(-8, -17, 16, 14);
    ctx.fillStyle = '#a4d4a0';
    ctx.fillRect(-5, -17, 5, 3);
  } else {
    ctx.fillStyle =
      type === 'mage' ? '#a787b3' : type === 'tank' ? '#878b8c' : boss ? '#a86862' : '#a98b65';
    ctx.fillRect(-8, -23, 16, 20);
    ctx.fillRect(-12, -16, 5, 11);
    ctx.fillRect(8, -16, 5, 11);
    ctx.fillStyle = '#393740';
    ctx.fillRect(-7, -3, 5, 5);
    ctx.fillRect(3, -3, 5, 5);
    ctx.fillStyle = '#d4c39a';
    ctx.fillRect(-10, -27, 4, 8);
    ctx.fillRect(6, -27, 4, 8);
  }
  ctx.fillStyle = '#152929';
  ctx.fillRect(-4, -12, 3, 3);
  ctx.fillRect(4, -12, 3, 3);
  ctx.fillStyle = '#f4d297';
  ctx.fillRect(-3, -12, 1, 1);
  ctx.fillRect(5, -12, 1, 1);
  ctx.restore();
}
