import { B } from '../data/balance';
import type { Squad } from '../state/types';
export const counters: Record<string, string> = {
  Vanguarda: 'Ranger',
  Ranger: 'Mágico',
  Mágico: 'Vanguarda',
};
export function battleTick(allies: Squad[], enemies: Squad[], aura = 1) {
  const a = structuredClone(allies),
    e = structuredClone(enemies);
  const strike = (side: Squad[], foes: Squad[], bonus: number) => {
    for (const s of side) {
      if (s.count <= 0 || s.morale < 20 || s.order === 'Recuar') continue;
      const t = foes.find((t) => t.count > 0 && t.morale >= 20);
      if (!t) break;
      const counter = counters[s.type] === t.type ? B.counter : 1;
      const guard = foes.some((f) => f.type === 'Guardião' && f.count > 0) ? 0.8 : 1;
      const order = s.order === 'Cercar' ? 1.2 : s.order === 'Defender' ? 0.65 : 1;
      const defense = t.order === 'Defender' ? 0.65 : 1;
      const lost = Math.min(
        t.count,
        Math.max(
          1,
          Math.floor(
            s.count *
              B.troopDamage *
              counter *
              guard *
              order *
              defense *
              (s.morale / 100) *
              bonus *
              (s.officer ? B.officerAura : 1),
          ),
        ),
      );
      t.count -= lost;
      t.morale = Math.max(0, t.morale - lost * 1.2);
    }
  };
  strike(allies, e, aura);
  strike(enemies, a, 1);
  return {
    allies: a,
    enemies: e,
    won: !e.some((s) => s.count > 0 && s.morale >= 20),
    lost: !a.some((s) => s.count > 0 && s.morale >= 20 && s.order !== 'Recuar'),
  };
}
