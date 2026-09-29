import { ATTRIBUTES, B, ELEMENTS, FORMS } from '../data/balance';
import { raceById } from '../data/races';
import { PERSONALITIES, TRAITS } from '../data/content';
import { mulberry32, pick, range } from './rng';
import { stats } from './stats';
import type { Attributes, Character, Element } from '../state/types';
export const defaultAttributes = (): Attributes => ({
  FOR: 13,
  DES: 12,
  CON: 14,
  INT: 10,
  SAB: 12,
  CAR: 13,
});
export function createCharacter(
  name: string,
  race: string,
  classId: string,
  attrs: Attributes,
  seed: number,
): Character {
  const rng = mulberry32(seed),
    racial = raceById(race);
  const finalAttrs = { ...attrs };
  ATTRIBUTES.forEach((a) => (finalAttrs[a] += racial.mods[a] ?? 0));
  const affinities = Object.fromEntries(
    ELEMENTS.map((e) => [e, range(rng, 10, 35) + (racial.elements.includes(e) ? 20 : 0)]),
  ) as Record<Element, number>;
  const element = ELEMENTS.reduce((a, b) => (affinities[a] >= affinities[b] ? a : b));
  const c: Character = {
    id: `hero-${seed}`,
    name: name.trim().slice(0, 24) || 'Aerin',
    race,
    classId,
    level: 1,
    xp: 0,
    attrs: finalAttrs,
    points: 0,
    tier: 0,
    branch: null,
    specialization: null,
    secondary: null,
    affinities,
    form: pick(rng, FORMS),
    grimoire: { element, pages: [1, 0, 0, 0, 0], forbidden: false },
    equipment: {},
    awakened: false,
    hp: 1,
    mana: 1,
    stamina: 1,
    kills: 0,
    bossKills: 0,
    potential: range(rng, 0, 7),
    loyalty: 70,
    personality: pick(rng, PERSONALITIES),
    trait: pick(rng, TRAITS),
    cost: B.recruitBase,
    salary: B.recruitSalary,
  };
  const s = stats(c);
  c.hp = s.hp;
  c.mana = s.mana;
  c.stamina = s.stamina;
  return c;
}
