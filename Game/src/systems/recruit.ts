import { B } from '../data/balance';
import { CLASSES } from '../data/classes';
import { RACES } from '../data/races';
import { createCharacter, defaultAttributes } from './character';
import { hash, mulberry32, pick } from './rng';
import { power, rankIndex } from './stats';
import type { SaveGame } from '../state/types';
export function recruits(game: SaveGame) {
  const seed = hash(
      `${game.seed}:${game.world.region}:${Math.floor((game.world.day - 1) / B.weekDays)}`,
    ),
    rng = mulberry32(seed);
  return Array.from({ length: 8 }, (_, i) => {
    const c = createCharacter(
      `${pick(rng, ['Lyra', 'Theron', 'Kael', 'Mira', 'Orin', 'Sylas', 'Eira', 'Vex'])} ${pick(rng, ['Alvorada', 'Valeverde', 'Passolongo', 'Brumafria', 'Cinzentos', 'Lunargenta'])}`,
      pick(rng, RACES.slice(0, 24)).id,
      pick(rng, CLASSES).id,
      defaultAttributes(),
      seed + i,
    );
    c.cost = Math.round(B.recruitBase * 2 ** rankIndex(power(c)) * (1 + c.potential * 0.15));
    return c;
  }).filter((c) => !game.recruited.includes(c.id));
}
