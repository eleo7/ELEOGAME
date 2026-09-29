import { MODIFIERS } from '../data/content';
import { mulberry32, pick, range } from './rng';
import type { Dungeon } from '../state/types';
export function createDungeon(seed: number): Dungeon {
  const rng = mulberry32(seed);
  const rooms: Dungeon['rooms'] = Array.from({ length: range(rng, 5, 8) }, (_, i) =>
    i === 0 ? 'combat' : pick(rng, ['combat', 'combat', 'elite', 'treasure', 'rest'] as const),
  );
  rooms.push('boss');
  return { seed, room: 0, rooms, modifier: pick(rng, MODIFIERS), cleared: false };
}
