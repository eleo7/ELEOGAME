import { B } from '../data/balance';
import { REGIONS, regionById } from '../data/regions';
import { hash, mulberry32, pick } from './rng';
import type { SaveGame, WorldEvent } from '../state/types';
export function log(g: SaveGame, text: string, kind: WorldEvent['kind'] = 'world') {
  g.world.log.unshift({
    id: `${g.world.day}-${g.world.log.length}-${hash(text)}`,
    day: g.world.day,
    text,
    kind,
  });
  g.world.log = g.world.log.slice(0, 50);
}
export function advanceDays(g: SaveGame, days: number) {
  for (let d = 0; d < days; d++) {
    g.world.day++;
    const rng = mulberry32(hash(`${g.seed}:day:${g.world.day}`));
    for (const c of g.party) {
      if (g.gold >= c.salary) {
        g.gold -= c.salary;
        c.loyalty = Math.min(100, c.loyalty + B.loyaltyPay);
      } else c.loyalty = Math.max(0, c.loyalty - B.loyaltyMiss);
      if (g.resources.Comida > 0) g.resources.Comida -= B.foodPerMember;
      else c.loyalty = Math.max(0, c.loyalty - 3);
    }
    g.party = g.party.filter((c) => {
      if (c.loyalty < B.abandonLoyalty && rng() < B.abandonChance) {
        log(g, `${c.name} deixou a companhia por falta de lealdade.`, 'economy');
        return false;
      }
      return true;
    });
    g.activeParty = g.activeParty.filter((id) => g.party.some((c) => c.id === id));
    for (const squad of g.squads) {
      if (squad.officer && !g.party.some((c) => c.id === squad.officer)) squad.officer = null;
      const upkeep = Math.ceil(squad.count / B.troopsPerUpkeep);
      if (g.gold >= upkeep && g.resources.Comida >= upkeep) {
        g.gold -= upkeep;
        g.resources.Comida -= upkeep;
        squad.morale = Math.min(100, squad.morale + 1);
      } else squad.morale = Math.max(0, squad.morale - B.unpaidMoraleLoss);
    }
    for (const t of g.territories) {
      for (const [name, level] of Object.entries(t.buildings)) {
        const amount = Math.floor(
          ((B.production * level * t.stability) / 100) * (1 + (g.research.Economia ?? 0) * 0.05),
        );
        const resource = (
          {
            Fazenda: 'Comida',
            Serraria: 'Madeira',
            Mina: 'Ferro',
            Cristalaria: 'Cristal',
          } as Record<string, string>
        )[name];
        if (resource) g.resources[resource] = (g.resources[resource] ?? 0) + amount;
        else g.gold += Math.floor(amount / 2);
      }
      g.gold += Math.floor(t.tax * 2);
      t.stability = Math.max(10, Math.min(100, t.stability + (t.tax > 20 ? -2 : 1)));
    }
    for (const k of g.kingdoms) {
      k.policy = pick(rng, [
        'Expandir',
        'Comerciar',
        'Pesquisar',
        'Defender',
        k.id === 'region-2' ? 'Atacar' : 'Comerciar',
      ]);
      if (k.policy === 'Comerciar') k.wealth += 20;
      if (k.policy === 'Expandir' || k.policy === 'Pesquisar') k.military += 5;
      if (k.war && g.territories.length && rng() < 0.25) {
        const t = pick(rng, g.territories);
        t.stability = Math.max(10, t.stability - 10);
        log(g, `${regionById(k.id).name} atacou ${t.name}. Estabilidade −10.`);
      }
    }
    for (const r of REGIONS) {
      g.world.danger[r.id] = (g.world.danger[r.id] ?? 0) + 1;
      if (g.world.danger[r.id] === 7)
        log(g, `Quebra de Dungeon em ${r.name}. Os inimigos da região ficaram mais fortes.`);
    }
    if (rng() < 0.55) {
      const region = pick(rng, REGIONS);
      const event = pick(rng, [
        'Festival reúne aventureiros em',
        'Um mercador raro chegou a',
        'Monstros bloqueiam as estradas de',
        'A guilda busca exploradores em',
        'Uma praga ameaça as colheitas de',
      ]);
      log(g, `${event} ${region.name}.`);
    }
  }
}
