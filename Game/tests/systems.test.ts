import test from 'node:test';
import assert from 'node:assert/strict';
import { B, ATTRIBUTES } from '../src/data/balance';
import { RACES } from '../src/data/races';
import { REGIONS } from '../src/data/regions';
import { CLASSES } from '../src/data/classes';
import { createCharacter, defaultAttributes } from '../src/systems/character';
import {
  damage,
  gainXp,
  pointCost,
  power,
  rank,
  rankIndex,
  stats,
  xpNeeded,
} from '../src/systems/stats';
import { mulberry32, weighted } from '../src/systems/rng';
import { createDungeon } from '../src/systems/dungeon';
import { generateZone, blocked } from '../src/engine/zone';
import { recruits } from '../src/systems/recruit';
import { parseSave, save } from '../src/systems/save';
import { evolve, evolutionRequirement } from '../src/systems/evolution';
import { advanceDays } from '../src/systems/worldSim';
import { newGame } from '../src/state/store';
import { claimQuest, equip, hire, travel, build, addSquad } from '../src/systems/actions';
import { battleTick } from '../src/systems/battle';
import type { Squad } from '../src/state/types';
const fixture = () => newGame('Teste', 'race-0', 'warrior', defaultAttributes(), 12345);
test('27-point creation budget uses nonlinear point buy', () => {
  assert.equal(pointCost(defaultAttributes()), 27);
  assert.equal(pointCost({ FOR: 15, DES: 15, CON: 15, INT: 8, SAB: 8, CAR: 8 }), 27);
});
test('all race and class combinations start at rank E and have valid resource caps', () => {
  for (const r of RACES.slice(0, 24))
    for (const c of CLASSES) {
      const p = createCharacter('A', r.id, c.id, defaultAttributes(), 1);
      assert.equal(rank(p), 'E');
      assert.equal(p.hp, stats(p).hp);
      assert.equal(p.mana, stats(p).mana);
      assert(ATTRIBUTES.every((a) => p.attrs[a] > 0));
    }
});
test('rank thresholds are inclusive and unrelated to level alone', () => {
  B.rankPower.forEach((value, i) => {
    assert.equal(rankIndex(value), i);
    if (i) assert.equal(rankIndex(value - 1), i - 1);
  });
  const g = fixture();
  g.player.awakened = true;
  assert.equal(rank(g.player), 'C');
});
test('XP carries remainder, grants free points and obeys level cap', () => {
  const c = fixture().player;
  gainXp(c, 10000);
  assert(c.level > 5);
  assert.equal(c.points, (c.level - 1) * B.pointsPerLevel);
  assert(c.xp < xpNeeded(c.level));
  c.level = 99;
  gainXp(c, 1e9);
  assert.equal(c.level, 100);
  assert.equal(c.xp, 0);
});
test('damage applies defense and critical multiplier', () => {
  assert.equal(damage(100, 1, 100), 50);
  assert.equal(damage(100, 1, 100, true), 75);
});
test('procedural generators are deterministic', () => {
  const a = mulberry32(24),
    b = mulberry32(24);
  for (let i = 0; i < 100; i++) assert.equal(a(), b());
  assert.deepEqual(createDungeon(99), createDungeon(99));
  assert.notDeepEqual(createDungeon(99), createDungeon(100));
  assert.equal(
    weighted(() => 0.9999, [1, 0]),
    0,
  );
});
test('zones always have a passable exit corridor and reachable spawns', () => {
  for (let seed = 0; seed < 80; seed++) {
    const map = generateZone(seed);
    for (let x = 128; x <= 850; x += 8) assert.equal(blocked(map, x, 320), false);
    assert(map.spawn.length >= 15);
    map.spawn.forEach((p) => assert.equal(blocked(map, p.x, p.y), false));
  }
});
test('dungeons contain a boss only at the final room', () => {
  for (let seed = 0; seed < 50; seed++) {
    const d = createDungeon(seed);
    assert(d.rooms.length >= 6 && d.rooms.length <= 9);
    assert.equal(d.rooms.at(-1), 'boss');
    assert.equal(d.rooms.filter((r) => r === 'boss').length, 1);
  }
});
test('save roundtrip preserves all state', () => {
  const g = fixture();
  assert.deepEqual(parseSave(JSON.stringify(g)), g);
  assert.equal(typeof save(g), 'string');
});
test('save validator rejects corrupt nested state and incompatible versions', () => {
  for (const mutate of [
    (g: any) => (g.version = 2),
    (g: any) => (g.player.attrs = null),
    (g: any) => (g.player.grimoire.pages = [9]),
    (g: any) => (g.player.level = 0),
    (g: any) => (g.kingdoms[0].relation = 'oops'),
    (g: any) => (g.world.region = 'missing'),
    (g: any) => (g.inventory = [{ name: 'bad' }]),
    (g: any) => (g.settings.timeScale = Infinity),
  ]) {
    const g = fixture();
    mutate(g);
    assert.throws(() => parseSave(JSON.stringify(g)));
  }
  assert.throws(() => parseSave('{'));
});
test('recruits are stable within a week, refresh next week and cannot be hired twice', () => {
  const g = fixture();
  const list = recruits(g);
  g.world.day = 6;
  assert.deepEqual(recruits(g), list);
  g.gold = 10000;
  const id = list[0].id;
  assert(hire(g, id));
  assert(!hire(g, id));
  assert.equal(g.party.length, 1);
  g.world.day = 8;
  assert.notDeepEqual(recruits(g), list);
});
test('party cap is enforced before company unlock', () => {
  const g = fixture();
  g.gold = 10000;
  for (const c of recruits(g)) hire(g, c.id);
  assert.equal(g.party.length, 3);
  assert.equal(g.activeParty.length, 3);
  g.player.awakened = true;
  for (const c of recruits(g)) hire(g, c.id);
  assert(g.party.length > 3);
  assert.equal(g.activeParty.length, 3);
});
test('unpaid salaries lower loyalty, traveling advances the day once', () => {
  const g = fixture();
  hire(g, recruits(g)[0].id);
  g.gold = 0;
  const loyalty = g.party[0].loyalty;
  advanceDays(g, 1);
  assert.equal(g.party[0].loyalty, loyalty - B.loyaltyMiss);
  const day = g.world.day;
  travel(g, REGIONS[1].id);
  assert.equal(g.world.day, day + 1);
  travel(g, REGIONS[1].id);
  assert.equal(g.world.day, day + 1);
});
test('quest rewards cannot be claimed twice or before acceptance', () => {
  const g = fixture();
  g.player.kills = 10;
  const gold = g.gold;
  assert(claimQuest(g, 'q1'));
  assert.equal(g.gold, gold + 60);
  assert(!claimQuest(g, 'q1'));
  assert(!claimQuest(g, 'q2'));
});
test('first awakening follows the level-15 contract', () => {
  const g = fixture();
  g.quests.active.push('q10');
  assert(!claimQuest(g, 'q10'));
  g.player.level = 15;
  const before = power(g.player);
  assert(claimQuest(g, 'q10'));
  assert(g.player.awakened);
  assert(power(g.player) >= before + B.awakeningPower);
});
test('evolution validates level, boss condition, essence and fixes branch', () => {
  const g = fixture();
  assert(evolutionRequirement(g));
  g.player.level = 10;
  g.essence = 1000;
  assert(!evolve(g, 'Arcano'));
  g.player.bossKills = 5;
  assert(evolve(g, 'Arcano'));
  assert.equal(g.player.tier, 1);
  assert.equal(g.player.branch, null);
  g.player.level = 25;
  assert(evolve(g, 'Único'));
  assert.equal(g.player.branch, 'Único');
  g.player.level = 45;
  assert(evolve(g, 'Marcial'));
  assert.equal(g.player.branch, 'Único');
});
test('equipping replaces item and increases power without duplication', () => {
  const g = fixture(),
    before = power(g.player);
  g.inventory.push({
    id: 'a',
    name: 'Espada',
    slot: 'Arma',
    rarity: 1,
    level: 1,
    power: 20,
    value: 30,
  });
  equip(g, 'a');
  assert.equal(power(g.player), before + 20);
  assert.equal(g.inventory.length, 0);
  equip(g, 'a');
  assert.equal(g.inventory.length, 0);
});
test('economy respects slots, produces resources and charges only valid builds', () => {
  const g = fixture();
  g.gold = 10000;
  g.territories.push({ id: 'v', name: 'Vila', tier: 0, stability: 100, tax: 10, buildings: {} });
  build(g, 'v', 'Fazenda');
  build(g, 'v', 'Serraria');
  build(g, 'v', 'Mina');
  const gold = g.gold;
  build(g, 'v', 'Cristalaria');
  assert.equal(g.gold, gold);
  advanceDays(g, 1);
  assert.equal(g.resources.Madeira, 10);
  assert.equal(g.resources.Ferro, 10);
  assert.equal(g.resources.Comida, 40);
});
const squad = (type: Squad['type'], order = 'Atacar'): Squad => ({
  id: type,
  type,
  count: 100,
  morale: 100,
  order,
  officer: null,
});
test('tactical counter and defensive orders materially change casualties', () => {
  const counter = battleTick([squad('Vanguarda')], [squad('Ranger')]);
  const neutral = battleTick([squad('Vanguarda')], [squad('Monstros')]);
  assert(counter.enemies[0].count < neutral.enemies[0].count);
  const defensive = battleTick([squad('Vanguarda')], [squad('Monstros', 'Defender')]);
  assert(defensive.enemies[0].count > neutral.enemies[0].count);
});
test('retreat ends a battle and troop recruitment is rank-gated', () => {
  assert(battleTick([squad('Vanguarda', 'Recuar')], [squad('Ranger')]).lost);
  const g = fixture();
  addSquad(g, 'Ranger');
  assert.equal(g.squads.length, 0);
  g.player.awakened = true;
  addSquad(g, 'Ranger');
  assert.equal(g.squads.length, 1);
});
