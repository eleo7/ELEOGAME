import { B, ATTRIBUTES } from '../data/balance';
import { classById } from '../data/classes';
import type { Character, Attributes } from '../state/types';
export const xpNeeded = (level: number) => Math.floor(B.xpBase * level ** B.xpExponent);
export const pointCost = (attrs: Attributes) =>
  ATTRIBUTES.reduce((s, a) => s + B.pointCosts[attrs[a] - B.attributeMin], 0);
export function power(c: Character) {
  return Math.floor(
    ATTRIBUTES.reduce((s, a) => s + c.attrs[a], 0) -
      48 +
      4 * c.level +
      Object.values(c.equipment).reduce((s, i) => s + i.power, 0) +
      c.grimoire.pages.reduce((s, p) => s + p * 3, 0) +
      B.tierPower[c.tier] +
      (c.awakened ? B.awakeningPower : 0),
  );
}
export const rankIndex = (pw: number) =>
  B.rankPower.reduce<number>((index, threshold, i) => (pw >= threshold ? i : index), 0);
export const rank = (c: Character) => B.ranks[rankIndex(power(c))];
export function stats(c: Character) {
  const a = c.attrs;
  const weapon = c.equipment.Arma?.power ?? 4;
  const armor = Object.values(c.equipment)
    .filter((i) => i.slot !== 'Arma')
    .reduce((s, i) => s + i.power * 0.3, 0);
  return {
    hp: B.hpBase + a.CON * B.hpCon + c.level * B.hpLevel,
    mana: B.manaBase + a.INT * B.manaInt + a.SAB * B.manaWis + c.level * B.manaLevel,
    stamina: B.staminaBase + (a.CON + a.DES) * B.staminaAttr,
    attack: a.FOR * B.physicalStr + a.DES * B.physicalDex + weapon,
    magic: a.INT * B.magicalInt + a.SAB * B.magicalWis + weapon,
    defense: a.CON + armor,
    speed: B.speedBase + a.DES * B.speedDex,
    crit: B.critBase + a.DES * B.critDex,
  };
}
export const damage = (attack: number, mult: number, defense: number, critical = false) =>
  Math.max(
    1,
    Math.round(
      attack * mult * (B.armorScale / (B.armorScale + defense)) * (critical ? B.critMultiplier : 1),
    ),
  );
export function gainXp(c: Character, amount: number) {
  c.xp += Math.round(amount * (c.race === 'race-0' ? 1.1 : 1));
  let levels = 0;
  while (c.level < B.maxLevel && c.xp >= xpNeeded(c.level)) {
    c.xp -= xpNeeded(c.level);
    c.level++;
    c.points += B.pointsPerLevel;
    c.attrs[classById(c.classId).primary]++;
    levels++;
  }
  if (c.level === B.maxLevel) c.xp = 0;
  if (levels) {
    const s = stats(c);
    c.hp = s.hp;
    c.mana = s.mana;
    c.stamina = s.stamina;
  }
  return levels;
}
