import { useSyncExternalStore } from 'react';
import { B } from '../data/balance';
import { REGIONS } from '../data/regions';
import { raceById } from '../data/races';
import { createCharacter } from '../systems/character';
import { save, load } from '../systems/save';
import type { Attributes, SaveGame } from './types';
const initial = load();
let game: SaveGame | null = initial.game;
let saveError = initial.error;
const listeners = new Set<() => void>();
export function getGame() {
  return game;
}
export function getSaveError() {
  return saveError;
}
export function replaceGame(next: SaveGame) {
  game = next;
  saveError = save(next);
  listeners.forEach((l) => l());
}
export function updateGame(fn: (draft: SaveGame) => void) {
  if (!game) return;
  const draft = structuredClone(game);
  fn(draft);
  replaceGame(draft);
}
export function useGame() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => game,
  );
}
export function newGame(
  name: string,
  race: string,
  classId: string,
  attrs: Attributes,
  seed: number,
  hub = false,
) {
  const player = createCharacter(name, race, classId, attrs, seed);
  const region = hub
    ? REGIONS[6]
    : (REGIONS.find((r) => r.name === raceById(race).kingdom) ?? REGIONS[6]);
  const next: SaveGame = {
    version: 1,
    seed,
    player,
    party: [],
    activeParty: [],
    companyName: 'Companhia da Aurora',
    companyOrder: 'agressivo',
    inventory: [],
    gold: B.startGold,
    essence: 0,
    fame: 0,
    resources: { Comida: 30, Madeira: 0, Pedra: 0, Ferro: 0, Cristal: 0, Influência: 0 },
    world: {
      day: 1,
      seconds: 0,
      region: region.id,
      node: region.nodes[0].id,
      visits: 0,
      clears: {},
      danger: {},
      log: [
        {
          id: 'first',
          day: 1,
          text: `${name} chegou às marcas de ${region.name}. Uma nova história começa.`,
          kind: 'progress',
        },
      ],
    },
    kingdoms: REGIONS.filter((r) => r.kingdom).map((r) => ({
      id: r.id,
      military: 100,
      wealth: 500,
      stability: 80,
      relation: 0,
      policy: 'Defender',
      war: false,
    })),
    territories: [],
    squads: [],
    quests: { active: ['q1'], completed: [] },
    recruited: [],
    research: { Militar: 0, Magia: 0, Economia: 0, Diplomacia: 0 },
    settings: { volume: 0.25, difficulty: 1, timeScale: 1 },
    tutorial: 0,
  };
  replaceGame(next);
  return next;
}
