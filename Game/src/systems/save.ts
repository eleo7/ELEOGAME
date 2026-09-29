import { B, ATTRIBUTES, ELEMENTS } from '../data/balance';
import { RACES } from '../data/races';
import { CLASSES } from '../data/classes';
import { REGIONS } from '../data/regions';
import type { SaveGame } from '../state/types';
const KEY = 'eternal-realms.save.v1';
function assert(ok: unknown, message = 'Arquivo de save inválido'): asserts ok {
  if (!ok) throw new Error(message);
}
const object = (v: unknown): v is Record<string, any> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (n: unknown, min = 0, max = 1e12) =>
  typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
function item(i: any) {
  assert(
    object(i) &&
      typeof i.id === 'string' &&
      typeof i.name === 'string' &&
      typeof i.slot === 'string' &&
      finite(i.rarity, 0, 7) &&
      Number.isInteger(i.rarity) &&
      finite(i.power) &&
      finite(i.value) &&
      finite(i.level, 1, 100),
  );
}
function character(c: any) {
  assert(
    object(c) &&
      typeof c.id === 'string' &&
      typeof c.name === 'string' &&
      c.name.length <= 80 &&
      RACES.some((r) => r.id === c.race) &&
      CLASSES.some((k) => k.id === c.classId),
  );
  for (const key of [
    'xp',
    'points',
    'hp',
    'mana',
    'stamina',
    'kills',
    'bossKills',
    'cost',
    'salary',
  ])
    assert(finite(c[key]));
  assert(
    finite(c.level, 1, 100) &&
      Number.isInteger(c.level) &&
      finite(c.tier, 0, 5) &&
      Number.isInteger(c.tier) &&
      finite(c.loyalty, 0, 100) &&
      finite(c.potential, 0, 7),
  );
  assert(object(c.attrs) && ATTRIBUTES.every((a) => finite(c.attrs[a], 1, 10000)));
  assert(object(c.affinities) && ELEMENTS.every((e) => finite(c.affinities[e], 0, 100)));
  assert(
    object(c.grimoire) &&
      ELEMENTS.includes(c.grimoire.element) &&
      Array.isArray(c.grimoire.pages) &&
      c.grimoire.pages.length === 5 &&
      c.grimoire.pages.every((p: unknown) => finite(p, 0, 3) && Number.isInteger(p)) &&
      typeof c.grimoire.forbidden === 'boolean',
  );
  assert(object(c.equipment));
  Object.values(c.equipment).forEach(item);
  assert(
    typeof c.form === 'string' &&
      typeof c.personality === 'string' &&
      typeof c.trait === 'string' &&
      typeof c.awakened === 'boolean',
  );
  assert(c.branch === null || ['Marcial', 'Arcano', 'Único'].includes(c.branch));
  assert(c.specialization === null || finite(c.specialization, 0, 2));
  assert(c.secondary === null || CLASSES.some((k) => k.id === c.secondary));
}
export function parseSave(raw: string): SaveGame {
  assert(raw.length < 4_000_000, 'Save excede o limite de 4 MB');
  const g = JSON.parse(raw);
  assert(object(g) && g.version === 1, 'Versão de save incompatível');
  character(g.player);
  assert(Array.isArray(g.party) && g.party.length <= B.maxNamed);
  g.party.forEach(character);
  assert(
    Array.isArray(g.activeParty) &&
      g.activeParty.length <= 3 &&
      g.activeParty.every((id: unknown) => g.party.some((c: any) => c.id === id)),
  );
  assert(Array.isArray(g.inventory) && g.inventory.length <= 500);
  g.inventory.forEach(item);
  for (const k of ['seed', 'gold', 'essence', 'fame', 'tutorial']) assert(finite(g[k]));
  assert(
    typeof g.companyName === 'string' &&
      ['agressivo', 'defensivo', 'suporte'].includes(g.companyOrder),
  );
  assert(
    object(g.world) &&
      finite(g.world.day, 1) &&
      finite(g.world.seconds, 0, B.daySeconds) &&
      REGIONS.some((r) => r.id === g.world.region) &&
      typeof g.world.node === 'string' &&
      finite(g.world.visits),
  );
  for (const field of [g.world.clears, g.world.danger, g.resources, g.research])
    assert(object(field) && Object.values(field).every((v) => finite(v)));
  assert(
    Array.isArray(g.world.log) &&
      g.world.log.length <= 50 &&
      g.world.log.every(
        (e: any) =>
          object(e) &&
          finite(e.day) &&
          typeof e.id === 'string' &&
          typeof e.text === 'string' &&
          ['world', 'combat', 'progress', 'economy'].includes(e.kind),
      ),
  );
  assert(
    object(g.quests) &&
      [g.quests.active, g.quests.completed, g.recruited].every(
        (v) => Array.isArray(v) && v.every((id: unknown) => typeof id === 'string'),
      ),
  );
  assert(
    Array.isArray(g.kingdoms) &&
      g.kingdoms.every(
        (k: any) =>
          object(k) &&
          REGIONS.some((r) => r.id === k.id) &&
          finite(k.military) &&
          finite(k.wealth) &&
          finite(k.stability, 0, 100) &&
          finite(k.relation, -100, 100) &&
          typeof k.policy === 'string' &&
          typeof k.war === 'boolean',
      ),
  );
  assert(
    Array.isArray(g.territories) &&
      g.territories.every(
        (t: any) =>
          object(t) &&
          typeof t.id === 'string' &&
          typeof t.name === 'string' &&
          finite(t.tier, 0, 3) &&
          finite(t.stability, 0, 100) &&
          finite(t.tax, 0, 30) &&
          object(t.buildings) &&
          Object.values(t.buildings).every((n) => finite(n, 0, 5)),
      ),
  );
  assert(
    Array.isArray(g.squads) &&
      g.squads.length <= 12 &&
      g.squads.every(
        (s: any) =>
          object(s) &&
          typeof s.id === 'string' &&
          ['Vanguarda', 'Guardião', 'Ranger', 'Mágico', 'Monstros'].includes(s.type) &&
          finite(s.count, 0, 10000) &&
          finite(s.morale, 0, 100) &&
          typeof s.order === 'string' &&
          (s.officer === null || typeof s.officer === 'string'),
      ),
  );
  assert(
    object(g.settings) &&
      finite(g.settings.volume, 0, 1) &&
      finite(g.settings.difficulty, 0.5, 2) &&
      finite(g.settings.timeScale, 0.5, 3),
  );
  return g as SaveGame;
}
export function save(g: SaveGame): string | null {
  try {
    localStorage.setItem(KEY, JSON.stringify(g));
    return null;
  } catch {
    return 'Não foi possível gravar no navegador. Exporte seu save para preservar o progresso.';
  }
}
export function load(): { game: SaveGame | null; error: string | null } {
  try {
    const raw = localStorage.getItem(KEY);
    return { game: raw ? parseSave(raw) : null, error: null };
  } catch {
    return {
      game: null,
      error: 'O save local não pôde ser lido. Importe um backup ou inicie uma nova jornada.',
    };
  }
}
export function exportSave(g: SaveGame) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(g, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = `eternal-realms-dia-${g.world.day}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
