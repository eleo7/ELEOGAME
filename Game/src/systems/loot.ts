import { B, SLOTS } from '../data/balance';
import { pick, weighted } from './rng';
import type { Item } from '../state/types';
export function createLoot(rng: () => number, level: number, boss = false): Item {
  const rarity = Math.max(boss ? 1 : 0, weighted(rng, B.rarityWeights));
  const slot = pick(rng, SLOTS);
  const power = Math.ceil(Math.max(1, level) * B.rarityMultipliers[rarity] * 2);
  return {
    id: `item-${Math.floor(rng() * 1e12)}`,
    name: `${slot.replace(/ I+$/, '')} ${pick(rng, ['do Peregrino', 'dos Ecos', 'da Aurora', 'do Carvalho', 'das Cinzas', 'do Guardião'])}`,
    slot,
    rarity,
    level,
    power,
    value: power * 3,
  };
}
