import { B } from '../data/balance';
import { mulberry32 } from '../systems/rng';
export interface ZoneMap {
  tiles: number[];
  spawn: { x: number; y: number }[];
  seed: number;
}
export function generateZone(seed: number): ZoneMap {
  const rng = mulberry32(seed);
  const tiles = Array.from({ length: B.zoneWidth * B.zoneHeight }, (_, i) => {
    const x = i % B.zoneWidth,
      y = Math.floor(i / B.zoneWidth);
    if (x < 2 || y < 2 || x >= B.zoneWidth - 2 || y >= B.zoneHeight - 2) return 2;
    const trail = Math.abs(y - 20) < 3 || Math.abs(x - 30) < 3 || Math.hypot(x - 8, y - 20) < 5;
    return trail ? 0 : rng() < 0.14 ? 2 : rng() < 0.06 ? 3 : 1;
  });
  const seen = new Set<number>(),
    queue = [20 * B.zoneWidth + 8];
  while (queue.length) {
    const i = queue.pop()!;
    if (seen.has(i) || tiles[i] >= 2) continue;
    seen.add(i);
    const x = i % B.zoneWidth,
      y = Math.floor(i / B.zoneWidth);
    if (x > 0) queue.push(i - 1);
    if (x < B.zoneWidth - 1) queue.push(i + 1);
    if (y > 0) queue.push(i - B.zoneWidth);
    if (y < B.zoneHeight - 1) queue.push(i + B.zoneWidth);
  }
  const spawn = Array.from(seen)
    .filter((i) => i % B.zoneWidth > 20)
    .filter((_, i) => i % 35 === 0)
    .map((i) => ({
      x: (i % B.zoneWidth) * B.tile + 8,
      y: Math.floor(i / B.zoneWidth) * B.tile + 8,
    }));
  return { tiles, spawn, seed };
}
export function blocked(map: ZoneMap, x: number, y: number) {
  const tx = Math.floor(x / B.tile),
    ty = Math.floor(y / B.tile);
  return (
    tx < 0 ||
    ty < 0 ||
    tx >= B.zoneWidth ||
    ty >= B.zoneHeight ||
    map.tiles[ty * B.zoneWidth + tx] >= 2
  );
}
