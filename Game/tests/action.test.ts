import test from 'node:test';
import assert from 'node:assert/strict';
import { ActionEngine } from '../src/engine/action';
import { newGame } from '../src/state/store';
import { defaultAttributes } from '../src/systems/character';
import { B } from '../src/data/balance';

test('action simulation: movement, pause, dodge, skill costs, kills, rewards and persistence', () => {
  const handlers = new Map<string, (event: any) => void>();
  let nextFrame: FrameRequestCallback = () => {};
  const old = {
    window: globalThis.window,
    document: globalThis.document,
    raf: globalThis.requestAnimationFrame,
    caf: globalThis.cancelAnimationFrame,
  };
  Object.assign(globalThis, {
    window: {
      addEventListener: (name: string, fn: (e: any) => void) => handlers.set(name, fn),
      removeEventListener: (name: string) => handlers.delete(name),
    },
    document: { hidden: false },
    requestAnimationFrame: (fn: FrameRequestCallback) => {
      nextFrame = fn;
      return 1;
    },
    cancelAnimationFrame: () => {},
  });
  const gradient = { addColorStop: () => {} };
  const ctx = new Proxy(
    {},
    {
      get: (_, key) => (key === 'createRadialGradient' ? () => gradient : () => {}),
      set: () => true,
    },
  );
  const canvas = {
    width: 800,
    height: 450,
    getContext: () => ctx,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as HTMLCanvasElement;
  const g = newGame('Simulação', 'race-0', 'warrior', defaultAttributes(), 92);
  g.settings.volume = 0;
  let saved = 0;
  const engine = new ActionEngine(
    canvas,
    g,
    false,
    () => {},
    () => saved++,
    () => {},
  );
  let now = performance.now();
  const step = (frames: number) => {
    for (let i = 0; i < frames; i++) {
      now += 1000 / 60;
      nextFrame(now);
    }
  };
  const key = (type: string, value: string) =>
    handlers.get(type)?.({
      key: value,
      target: { matches: () => false },
      preventDefault: () => {},
    });
  try {
    const x = engine.x;
    key('keydown', 'd');
    step(30);
    key('keyup', 'd');
    assert(engine.x > x + 30);
    engine.togglePause();
    const pausedX = engine.x;
    key('keydown', 'd');
    step(30);
    key('keyup', 'd');
    assert.equal(engine.x, pausedX);
    engine.togglePause();
    const stamina = engine.game.player.stamina;
    engine.trigger(' ');
    step(1);
    assert(engine.game.player.stamina < stamina);
    assert(engine.dodge > 0);
    const mana = engine.game.player.mana;
    engine.trigger('1');
    step(1);
    assert(engine.game.player.mana < mana);
    assert(engine.cooldowns[0] > 0);
    const after = engine.game.player.mana;
    engine.trigger('1');
    step(1);
    assert(engine.game.player.mana >= after);
    const enemy = engine.enemies[0];
    enemy.x = engine.x + 10;
    enemy.y = engine.y;
    enemy.hp = 1;
    const gold = engine.game.gold;
    engine.trigger('j');
    step(1);
    assert.equal(engine.game.player.kills, 1);
    assert(engine.game.gold > gold);
    assert(engine.game.essence >= B.enemyEssence);
    assert(saved > 0);
    engine.stop();
    assert.equal(handlers.has('keydown'), false);
  } finally {
    Object.assign(globalThis, {
      window: old.window,
      document: old.document,
      requestAnimationFrame: old.raf,
      cancelAnimationFrame: old.caf,
    });
  }
});
