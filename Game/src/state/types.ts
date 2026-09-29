export type Attribute = 'FOR' | 'DES' | 'CON' | 'INT' | 'SAB' | 'CAR';
export type Attributes = Record<Attribute, number>;
export type Element = 'Fogo' | 'Água' | 'Terra' | 'Ar' | 'Luz' | 'Trevas' | 'Espírito';
export type Branch = 'Marcial' | 'Arcano' | 'Único';
export type Screen =
  | 'world'
  | 'zone'
  | 'character'
  | 'grimoire'
  | 'inventory'
  | 'city'
  | 'company'
  | 'army'
  | 'kingdom'
  | 'journal'
  | 'settings';
export interface Race {
  id: string;
  name: string;
  kingdom: string;
  color: string;
  skin: string;
  mods: Partial<Attributes>;
  elements: Element[];
  first: string;
  finals: string[];
  passive: string;
  active: string;
}
export interface ClassDef {
  id: string;
  name: string;
  primary: Attribute;
  weapon: string;
  skills: string[];
  paths: string[][];
  color: string;
}
export interface Spell {
  name: string;
  element: Element;
  level: number;
  unlock: number;
}
export interface Grimoire {
  element: Element;
  pages: number[];
  forbidden: boolean;
}
export interface Item {
  id: string;
  name: string;
  slot: string;
  rarity: number;
  level: number;
  power: number;
  value: number;
}
export interface Character {
  id: string;
  name: string;
  race: string;
  classId: string;
  level: number;
  xp: number;
  attrs: Attributes;
  points: number;
  tier: number;
  branch: Branch | null;
  specialization: number | null;
  secondary: string | null;
  affinities: Record<Element, number>;
  form: string;
  grimoire: Grimoire;
  equipment: Record<string, Item>;
  awakened: boolean;
  hp: number;
  mana: number;
  stamina: number;
  kills: number;
  bossKills: number;
  potential: number;
  loyalty: number;
  personality: string;
  trait: string;
  cost: number;
  salary: number;
}
export type Recruit = Character;
export interface MapNode {
  id: string;
  name: string;
  type: 'city' | 'dungeon' | 'wild';
  x: number;
  y: number;
  region: string;
  level: number;
}
export interface Region {
  id: string;
  name: string;
  capital: string;
  color: string;
  level: number;
  x: number;
  y: number;
  biome: string;
  kingdom: boolean;
  nodes: MapNode[];
}
export interface Dungeon {
  seed: number;
  room: number;
  rooms: ('combat' | 'elite' | 'treasure' | 'rest' | 'boss')[];
  modifier: string;
  cleared: boolean;
}
export type SquadType = 'Vanguarda' | 'Guardião' | 'Ranger' | 'Mágico' | 'Monstros';
export interface Squad {
  id: string;
  type: SquadType;
  count: number;
  morale: number;
  officer: string | null;
  order: string;
}
export interface Territory {
  id: string;
  name: string;
  tier: number;
  stability: number;
  tax: number;
  buildings: Record<string, number>;
}
export interface Kingdom {
  id: string;
  military: number;
  wealth: number;
  stability: number;
  relation: number;
  policy: string;
  war: boolean;
}
export interface WorldEvent {
  id: string;
  day: number;
  text: string;
  kind: 'world' | 'combat' | 'progress' | 'economy';
}
export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'kill' | 'boss' | 'dungeon' | 'travel' | 'recruit' | 'level';
  target: number;
  gold: number;
  xp: number;
}
export interface SaveGame {
  version: 1;
  seed: number;
  player: Character;
  party: Character[];
  activeParty: string[];
  companyName: string;
  companyOrder: 'agressivo' | 'defensivo' | 'suporte';
  inventory: Item[];
  gold: number;
  essence: number;
  fame: number;
  resources: Record<string, number>;
  world: {
    day: number;
    seconds: number;
    region: string;
    node: string;
    visits: number;
    clears: Record<string, number>;
    danger: Record<string, number>;
    log: WorldEvent[];
  };
  kingdoms: Kingdom[];
  territories: Territory[];
  squads: Squad[];
  quests: { active: string[]; completed: string[] };
  recruited: string[];
  research: Record<string, number>;
  settings: { volume: number; difficulty: number; timeScale: number };
  tutorial: number;
}
