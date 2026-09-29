import { B, SLOTS } from '../data/balance';
import { QUESTS, BUILDINGS } from '../data/content';
import { regionById } from '../data/regions';
import { gainXp, power, rankIndex, stats } from './stats';
import { log, advanceDays } from './worldSim';
import { createLoot } from './loot';
import { hash, mulberry32 } from './rng';
import { recruits } from './recruit';
import type { SaveGame, Quest, SquadType } from '../state/types';
export function questProgress(g: SaveGame, q: Quest) {
  return q.type === 'kill'
    ? g.player.kills
    : q.type === 'boss'
      ? g.player.bossKills
      : q.type === 'dungeon'
        ? Object.entries(g.world.clears)
            .filter(([k]) => k.startsWith('dungeon'))
            .reduce((s, [, v]) => s + v, 0)
        : q.type === 'travel'
          ? g.world.visits
          : q.type === 'recruit'
            ? g.recruited.length
            : g.player.level;
}
export function claimQuest(g: SaveGame, id: string) {
  const q = QUESTS.find((q) => q.id === id);
  if (
    !q ||
    !g.quests.active.includes(id) ||
    g.quests.completed.includes(id) ||
    questProgress(g, q) < q.target
  )
    return false;
  g.quests.active = g.quests.active.filter((i) => i !== id);
  g.quests.completed.push(id);
  g.gold += q.gold;
  gainXp(g.player, q.xp);
  g.fame += 15;
  if (id === 'q10') {
    g.player.awakened = true;
    log(g, `${g.player.name} recebeu o Primeiro Despertar. +${B.awakeningPower} PW.`, 'progress');
  }
  log(g, `Contrato concluído: ${q.title}.`, 'progress');
  return true;
}
export function travel(g: SaveGame, id: string) {
  if (g.world.region === id) return;
  const r = regionById(id);
  g.world.region = r.id;
  g.world.node = r.nodes[0].id;
  g.world.visits++;
  advanceDays(g, B.travelDays);
  log(g, `A companhia chegou a ${r.name}.`);
}
export function hire(g: SaveGame, id: string) {
  const c = recruits(g).find((c) => c.id === id);
  const cap = rankIndex(power(g.player)) >= 2 ? B.companySize : B.partySize - 1;
  if (!c || g.gold < c.cost || g.party.length >= cap) return false;
  g.gold -= c.cost;
  g.party.push(c);
  g.recruited.push(c.id);
  if (g.activeParty.length < 3) g.activeParty.push(c.id);
  log(g, `${c.name} se juntou à companhia.`, 'progress');
  return true;
}
export function equip(g: SaveGame, id: string) {
  const item = g.inventory.find((i) => i.id === id);
  if (!item || !SLOTS.includes(item.slot)) return;
  const old = g.player.equipment[item.slot];
  g.inventory = g.inventory.filter((i) => i.id !== id);
  if (old) g.inventory.push(old);
  g.player.equipment[item.slot] = item;
  const s = stats(g.player);
  g.player.hp = Math.min(s.hp, g.player.hp);
}
export function buyItem(g: SaveGame, slot: string) {
  const cost = Math.floor(B.shopCost * (1 - Math.min(0.3, g.player.attrs.CAR * 0.005)));
  if (g.gold < cost || g.inventory.length >= 500) return false;
  g.gold -= cost;
  const item = createLoot(
    mulberry32(hash(`${g.seed}:shop:${g.world.day}:${g.gold}:${g.inventory.length}`)),
    g.player.level,
  );
  item.slot = slot;
  item.name = `${slot} da Guilda`;
  g.inventory.push(item);
  return true;
}
export function addSquad(g: SaveGame, type: SquadType) {
  if (rankIndex(power(g.player)) < 2 || g.gold < B.squadCost || g.squads.length >= 5) return;
  g.gold -= B.squadCost;
  g.squads.push({
    id: `squad-${g.seed}-${g.world.day}-${g.squads.length}`,
    type,
    count: B.squadSize,
    morale: 100,
    officer: null,
    order: 'Atacar',
  });
}
export function build(g: SaveGame, territoryId: string, name: string) {
  const t = g.territories.find((t) => t.id === territoryId);
  if (!t || !BUILDINGS.includes(name)) return;
  const level = t.buildings[name] ?? 0,
    cost = Math.round(B.buildingCost * B.buildingGrowth ** level);
  if (
    level >= B.buildingMax ||
    g.gold < cost ||
    (!level && Object.keys(t.buildings).length >= (t.tier + 1) * 3)
  )
    return;
  g.gold -= cost;
  t.buildings[name] = level + 1;
}
