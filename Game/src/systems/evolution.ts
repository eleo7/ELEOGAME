import { B } from '../data/balance';
import { classById } from '../data/classes';
import { log } from './worldSim';
import { stats } from './stats';
import type { Branch, SaveGame } from '../state/types';
export function evolutionRequirement(g: SaveGame) {
  const c = g.player,
    n = c.tier + 1;
  if (n >= B.tierLevels.length) return 'Evolução ancestral alcançada';
  if (c.level < B.tierLevels[n]) return `Requer nível ${B.tierLevels[n]}`;
  if (g.essence < B.tierCosts[n]) return `Requer ${B.tierCosts[n]} Essências`;
  if (c.bossKills < n) return `Derrote ${n} chefes`;
  return null;
}
export function evolve(g: SaveGame, branch: Branch) {
  if (evolutionRequirement(g)) return false;
  const c = g.player;
  c.tier++;
  g.essence -= B.tierCosts[c.tier];
  if (c.tier === 2) c.branch = branch;
  c.attrs[
    c.branch === 'Arcano' ? 'INT' : c.branch === 'Único' ? 'SAB' : classById(c.classId).primary
  ] += B.tierAttribute;
  const s = stats(c);
  c.hp = s.hp;
  log(g, `${c.name} evoluiu para T${c.tier}. A linhagem desperta.`, 'progress');
  return true;
}
