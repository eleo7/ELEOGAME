import { B, ELEMENT_COLORS, ELEMENTS } from '../data/balance';
import { BOSSES } from '../data/content';
import { regionById } from '../data/regions';
import { stats, damage, gainXp } from '../systems/stats';
import { createLoot } from '../systems/loot';
import { createDungeon } from '../systems/dungeon';
import { hash, mulberry32, pick } from '../systems/rng';
import { advanceDays, log } from '../systems/worldSim';
import type { SaveGame, Character, Dungeon } from '../state/types';
import { createInput } from './input';
import { fixedLoop } from './loop';
import { drawHero, drawTree, drawMonster } from './sprites';
import { generateZone, blocked, type ZoneMap } from './zone';
import { sound } from './audio';
interface Enemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  type: string;
  boss: boolean;
  cooldown: number;
  telegraph: number;
  targetX: number;
  targetY: number;
  burn: number;
  slow: number;
}
interface Particle {
  x: number;
  y: number;
  life: number;
  text: string;
  color: string;
}
interface Shot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  damage: number;
  hostile: boolean;
}
export interface ActionHud {
  hp: number;
  mana: number;
  stamina: number;
  kills: number;
  total: number;
  cooldowns: number[];
  paused: boolean;
  message: string;
  room: string;
  boss: string;
  xp: number;
  level: number;
}
export class ActionEngine {
  game: SaveGame;
  map!: ZoneMap;
  enemies: Enemy[] = [];
  particles: Particle[] = [];
  shots: Shot[] = [];
  x = 128;
  y = 320;
  facing = 1;
  time = 0;
  paused = false;
  finished = false;
  dodge = 0;
  attackCd = 0;
  slash = 0;
  combo = 0;
  cooldowns = [0, 0, 0, 0];
  camera = { x: 0, y: 0 };
  dungeon: Dungeon | null;
  message = 'Explore as marcas. Aproxime-se dos inimigos e use J para atacar.';
  private rng: () => number;
  private input;
  private stopLoop = () => {};
  private hudTimer = 0;
  private combatTime = 0;
  private dead = false;
  private chest = false;
  private companions: { c: Character; x: number; y: number; cd: number }[] = [];
  constructor(
    private canvas: HTMLCanvasElement,
    game: SaveGame,
    private dungeonMode: boolean,
    private onHud: (hud: ActionHud) => void,
    private onSave: (game: SaveGame) => void,
    private onExit: () => void,
  ) {
    this.game = structuredClone(game);
    const seed = hash(
      `${game.seed}:${game.world.node}:${game.world.clears[game.world.node] ?? 0}:${game.world.day}`,
    );
    this.rng = mulberry32(seed);
    this.dungeon = dungeonMode ? createDungeon(seed) : null;
    this.input = createInput(canvas);
    this.companions = game.party
      .filter((c) => game.activeParty.includes(c.id))
      .map((c, i) => ({ c: structuredClone(c), x: this.x - 20 - i * 12, y: this.y + 20, cd: 0 }));
    this.loadRoom(seed);
    this.stopLoop = fixedLoop(
      (dt) => this.update(dt),
      () => this.draw(),
    );
  }
  private loadRoom(seed: number) {
    this.map = generateZone(seed);
    this.x = 128;
    this.y = 320;
    this.enemies = [];
    this.shots = [];
    this.chest = false;
    const room = this.dungeon?.rooms[this.dungeon.room];
    const r = regionById(this.game.world.region);
    const level = r.level + (this.dungeonMode ? 2 : 0);
    const bossRoom = room === 'boss';
    const peaceful = room === 'rest' || room === 'treasure';
    const count = peaceful ? 0 : bossRoom ? 4 : this.dungeonMode ? 8 : 15;
    for (let i = 0; i < count; i++) {
      const pos = this.map.spawn[(i * 3) % this.map.spawn.length] ?? { x: 480 + i * 20, y: 320 };
      const boss = bossRoom ? i === 0 : !this.dungeonMode && i === count - 1;
      const hp =
        (B.enemyHp + level * B.enemyHpLevel) *
        (boss ? B.bossHpMultiplier : room === 'elite' ? 1.6 : 1);
      this.enemies.push({
        id: i,
        ...pos,
        hp,
        maxHp: hp,
        type: boss ? 'boss' : pick(this.rng, ['slime', 'melee', 'ranged', 'tank', 'mage']),
        boss,
        cooldown: 1 + this.rng(),
        telegraph: 0,
        targetX: 0,
        targetY: 0,
        burn: 0,
        slow: 0,
      });
    }
    this.message =
      room === 'rest'
        ? 'Fonte de descanso: pressione E para recuperar sua vida.'
        : room === 'treasure'
          ? 'Câmara do tesouro: pressione E para abrir o baú.'
          : bossRoom
            ? 'Uma presença ancestral desperta. Evite os círculos vermelhos.'
            : this.message;
    this.companions.forEach((c, i) => {
      c.x = this.x - 15;
      c.y = this.y + i * 15;
    });
  }
  togglePause() {
    this.paused = !this.paused;
  }
  trigger(key: string) {
    this.input.pressed.add(key);
  }
  stop() {
    this.stopLoop();
    this.input.dispose();
    this.commit();
  }
  private commit() {
    this.onSave(structuredClone(this.game));
  }
  private float(x: number, y: number, text: string, color = '#e9d18e') {
    this.particles.push({ x, y, life: 1, text, color });
    if (this.particles.length > 80) this.particles.shift();
  }
  private hit(e: Enemy, amount: number, magic = false) {
    if (e.hp <= 0) return;
    e.hp -= amount;
    this.float(e.x, e.y - 28, `${amount}`, magic ? '#94d8da' : '#f0dbb2');
    if (magic) e.burn = 3;
    if (e.hp <= 0) {
      const p = this.game.player,
        m = e.boss ? B.bossReward : 1,
        level = regionById(this.game.world.region).level;
      this.game.gold += B.enemyGold * m + level;
      this.game.essence += B.enemyEssence * m;
      p.kills++;
      if (e.boss) p.bossKills++;
      const levels = gainXp(p, (B.enemyXp + level * 5) * m);
      if (levels) {
        this.message = `Nível ${p.level}! Distribua seus pontos na ficha.`;
        sound('level', this.game.settings.volume);
        this.float(this.x, this.y - 45, `NÍVEL ${p.level}`, '#dce6a2');
      }
      if (this.rng() < B.lootChance || e.boss) {
        const item = createLoot(this.rng, Math.max(level, p.level), e.boss);
        if (this.game.inventory.length < 500) this.game.inventory.push(item);
        this.message = `Encontrado: ${item.name} · ${B.rarityNames[item.rarity]}`;
      }
      this.game.fame += e.boss ? 10 : 1;
      this.commit();
    }
  }
  private useSkill(index: number) {
    const p = this.game.player,
      s = stats(p);
    const cost = B.skillMana[index] * (1 - p.affinities[p.grimoire.element] / B.affinityCost);
    if (this.cooldowns[index] > 0 || p.mana < cost) return;
    p.mana -= cost;
    this.cooldowns[index] = B.skillCooldown[index];
    sound('magic', this.game.settings.volume);
    if (index === 2) {
      p.hp = Math.min(s.hp, p.hp + s.magic * B.healMultiplier);
      this.float(this.x, this.y - 40, 'RENOVAR', '#8ce0b0');
      return;
    }
    const magical = ['mage', 'cleric', 'summoner'].includes(p.classId);
    const power = magical
      ? s.magic * (1 + p.affinities[p.grimoire.element] / B.affinityDamage)
      : s.attack;
    const unlocked = p.grimoire.pages.filter((_, i) => p.level >= B.pageLevels[i]);
    const mult = B.skillMultiplier[index] * (1 + unlocked.reduce((a, b) => a + b, 0) * 0.04);
    const reach = index === 0 ? 220 : index === 1 ? 115 : 170;
    const targets = this.enemies
      .filter((e) => e.hp > 0 && Math.hypot(e.x - this.x, e.y - this.y) < reach)
      .sort(
        (a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y),
      );
    for (const e of index === 0 ? targets.slice(0, 1) : targets) {
      this.hit(e, damage(power, mult, 10), true);
      if (p.grimoire.element === 'Água' || p.grimoire.element === 'Ar') e.slow = 3;
    }
    this.slash = 0.3;
  }
  private update(dt: number) {
    if (this.input.take('p') || this.input.take('tab')) this.togglePause();
    if (this.paused || this.finished) {
      this.input.pressed.clear();
      this.publish(dt);
      return;
    }
    if (document.hidden) {
      this.input.pressed.clear();
      return;
    }
    const p = this.game.player,
      s = stats(p);
    this.time += dt;
    this.game.world.seconds += dt * this.game.settings.timeScale;
    if (this.game.world.seconds >= B.daySeconds) {
      this.game.world.seconds -= B.daySeconds;
      advanceDays(this.game, 1);
      this.commit();
    }
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.dodge = Math.max(0, this.dodge - dt);
    this.slash = Math.max(0, this.slash - dt);
    this.combatTime = Math.max(0, this.combatTime - dt);
    this.cooldowns = this.cooldowns.map((c) => Math.max(0, c - dt));
    p.mana = Math.min(s.mana, p.mana + p.attrs.SAB * B.manaRegen * dt);
    p.stamina = Math.min(s.stamina, p.stamina + B.staminaRegen * dt);
    if (this.combatTime === 0) p.hp = Math.min(s.hp, p.hp + p.attrs.CON * B.healthRegen * dt);
    let dx =
        Number(this.input.held.has('d') || this.input.held.has('arrowright')) -
        Number(this.input.held.has('a') || this.input.held.has('arrowleft')),
      dy =
        Number(this.input.held.has('s') || this.input.held.has('arrowdown')) -
        Number(this.input.held.has('w') || this.input.held.has('arrowup'));
    const len = Math.hypot(dx, dy);
    if (len) {
      dx /= len;
      dy /= len;
      if (dx) this.facing = dx > 0 ? 1 : -1;
    }
    if (this.input.take(' ') && p.stamina >= B.dodgeCost && this.dodge === 0) {
      p.stamina -= B.dodgeCost;
      this.dodge = B.dodgeDuration;
      if (!len) dx = this.facing;
    }
    if (this.dodge > 0 && !len) dx = this.facing;
    const speed =
      s.speed *
      (this.dodge > 0 ? B.dodgeSpeed : 1) *
      (this.dungeon?.modifier === 'Gravidade' ? B.modifierGravity : 1);
    const nx = this.x + dx * speed * dt,
      ny = this.y + dy * speed * dt;
    if (!blocked(this.map, nx - 5, this.y) && !blocked(this.map, nx + 5, this.y)) this.x = nx;
    if (!blocked(this.map, this.x, ny - 4) && !blocked(this.map, this.x, ny + 4)) this.y = ny;
    if ((this.input.take('j') || this.input.held.has('j')) && this.attackCd === 0) {
      this.attackCd = B.attackCooldown;
      this.slash = 0.15;
      this.combo = (this.combo + 1) % 3;
      sound('hit', this.game.settings.volume);
      const ranged = ['archer', 'mage', 'cleric', 'summoner'].includes(p.classId);
      const nearest = this.enemies
        .filter((e) => e.hp > 0)
        .sort(
          (a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y),
        )[0];
      if (ranged && nearest && Math.hypot(nearest.x - this.x, nearest.y - this.y) < 220) {
        const angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
        this.shots.push({
          x: this.x,
          y: this.y - 8,
          vx: Math.cos(angle) * 280,
          vy: Math.sin(angle) * 280,
          life: 1,
          damage: damage(p.classId === 'archer' ? s.attack : s.magic, 1, 10, this.rng() < s.crit),
          hostile: false,
        });
      } else
        for (const e of this.enemies)
          if (e.hp > 0 && Math.hypot(e.x - this.x, e.y - this.y) < B.attackRange)
            this.hit(
              e,
              damage(
                s.attack,
                1 + this.combo * 0.15,
                e.type === 'tank' ? 30 : 10,
                this.rng() < s.crit,
              ),
            );
    }
    for (let i = 0; i < 4; i++) if (this.input.take(String(i + 1))) this.useSkill(i);
    const alive = this.enemies.filter((e) => e.hp > 0);
    if (this.dungeon?.modifier === 'Veneno' && this.combatTime > 0)
      p.hp = Math.max(1, p.hp - B.modifierPoison * dt);
    for (const e of alive) {
      if (this.dungeon?.modifier === 'Regeneração')
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * B.modifierRegen * dt);
      const distance = Math.hypot(this.x - e.x, this.y - e.y);
      e.cooldown -= dt;
      e.slow = Math.max(0, e.slow - dt);
      if (e.burn > 0) {
        e.burn -= dt;
        e.hp -= stats(p).magic * 0.08 * dt;
        if (e.hp <= 0) {
          e.hp = 0.01;
          this.hit(e, 1);
          continue;
        }
      }
      if (e.telegraph > 0) {
        e.telegraph -= dt;
        if (e.telegraph <= 0) {
          const radius = e.boss ? 55 : 32;
          if (Math.hypot(this.x - e.targetX, this.y - e.targetY) < radius && this.dodge === 0) {
            p.hp -= damage(
              (B.enemyDamage + regionById(this.game.world.region).level * B.enemyDamageLevel) *
                (e.boss ? 2 : 1) *
                (this.dungeon?.modifier === 'Berserk' ? B.modifierBerserk : 1) *
                this.game.settings.difficulty *
                ((this.game.world.danger[this.game.world.region] ?? 0) >= 7 ? 1.25 : 1),
              1,
              s.defense,
            );
            this.float(this.x, this.y - 30, 'DANO', '#f29c8d');
            this.combatTime = 5;
          }
          e.cooldown = e.boss ? 1.2 : 1.7;
        }
        continue;
      }
      if (distance < B.aggroRange * (e.boss ? 1.5 : 1)) {
        this.combatTime = 3;
        const ranged = e.type === 'ranged' || e.type === 'mage';
        if (distance < (ranged ? 130 : e.boss ? 60 : 29) && e.cooldown <= 0) {
          if (ranged) {
            const angle = Math.atan2(this.y - e.y, this.x - e.x);
            this.shots.push({
              x: e.x,
              y: e.y - 10,
              vx: Math.cos(angle) * 100,
              vy: Math.sin(angle) * 100,
              life: 2,
              damage:
                (B.enemyDamage + regionById(this.game.world.region).level * B.enemyDamageLevel) *
                (this.dungeon?.modifier === 'Berserk' ? B.modifierBerserk : 1),
              hostile: true,
            });
            e.cooldown = 2;
          } else {
            e.telegraph = B.telegraph * (e.boss && e.hp / e.maxHp < 0.33 ? 0.7 : 1);
            e.targetX = this.x;
            e.targetY = this.y;
          }
        } else if (distance > (ranged ? 90 : 22)) {
          const speed =
            B.enemySpeed * (e.slow > 0 ? 0.5 : 1) * (e.boss && e.hp / e.maxHp < 0.66 ? 1.4 : 1);
          const ex = e.x + ((this.x - e.x) / distance) * speed * dt,
            ey = e.y + ((this.y - e.y) / distance) * speed * dt;
          if (!blocked(this.map, ex, e.y)) e.x = ex;
          if (!blocked(this.map, e.x, ey)) e.y = ey;
        }
      }
    }
    for (const c of this.companions) {
      c.cd -= dt;
      const target = alive.find(
        (e) =>
          Math.hypot(e.x - this.x, e.y - this.y) <
          (this.game.companyOrder === 'defensivo' ? 85 : 180),
      );
      const tx = target?.x ?? this.x - 22,
        ty = target?.y ?? this.y + 20;
      const distance = Math.hypot(tx - c.x, ty - c.y);
      if (distance > 25) {
        c.x += ((tx - c.x) / distance) * 85 * dt;
        c.y += ((ty - c.y) / distance) * 85 * dt;
      }
      if (c.cd <= 0) {
        if (this.game.companyOrder === 'suporte') {
          p.hp = Math.min(s.hp, p.hp + stats(c.c).magic * 0.25);
          c.cd = 3;
        } else if (target && distance < 55) {
          this.hit(target, damage(stats(c.c).attack, 0.65, 10));
          c.cd = 1;
        }
      }
    }
    for (const sh of this.shots) {
      sh.x += sh.vx * dt;
      sh.y += sh.vy * dt;
      sh.life -= dt;
      if (blocked(this.map, sh.x, sh.y)) sh.life = 0;
      if (sh.hostile && Math.hypot(sh.x - this.x, sh.y - this.y + 8) < 13) {
        if (this.dodge === 0) {
          p.hp -= damage(sh.damage * this.game.settings.difficulty, 1, s.defense);
          this.combatTime = 5;
        }
        sh.life = 0;
      } else if (!sh.hostile) {
        const e = alive.find((e) => Math.hypot(e.x - sh.x, e.y - 8 - sh.y) < 17);
        if (e) {
          this.hit(e, sh.damage);
          sh.life = 0;
        }
      }
    }
    this.shots = this.shots.filter((s) => s.life > 0).slice(-B.maxEntities);
    this.particles.forEach((p) => {
      p.life -= dt;
      p.y -= dt * 18;
    });
    this.particles = this.particles.filter((p) => p.life > 0);
    if (p.hp <= 0 && !this.dead) {
      this.dead = true;
      this.finished = true;
      this.game.gold = Math.floor(this.game.gold * 0.9);
      p.hp = Math.ceil(s.hp * 0.5);
      this.message = 'Você foi resgatado pela guilda. Perdeu 10% do ouro. Retorne ao mapa.';
      log(this.game, 'A guilda resgatou o grupo após uma derrota.', 'combat');
      this.commit();
    }
    if (this.input.take('e')) {
      const room = this.dungeon?.rooms[this.dungeon.room];
      if (room === 'rest' && !this.chest) {
        p.hp = s.hp;
        p.mana = s.mana;
        this.chest = true;
        this.message = 'Vida e mana restauradas. Siga até o portal à direita.';
      } else if (room === 'treasure' && !this.chest) {
        if (this.game.inventory.length < 500)
          this.game.inventory.push(createLoot(this.rng, p.level, true));
        this.chest = true;
        this.message = 'Tesouro coletado. Siga até o portal à direita.';
        this.commit();
      } else if (this.x < 175) {
        this.commit();
        this.onExit();
        return;
      } else if (this.x > 810 && alive.length === 0) {
        if (this.dungeon && this.dungeon.room < this.dungeon.rooms.length - 1) {
          this.dungeon.room++;
          this.loadRoom(this.dungeon.seed + this.dungeon.room);
          this.message = `Sala ${this.dungeon.room + 1}: ${this.dungeon.rooms[this.dungeon.room] === 'boss' ? 'guardião ancestral' : 'explore e encontre o próximo portal'}.`;
        } else if (!this.finished) {
          this.finished = true;
          const node = this.game.world.node;
          this.game.world.clears[node] = (this.game.world.clears[node] ?? 0) + 1;
          this.game.world.danger[this.game.world.region] = 0;
          this.game.gold += 75;
          this.game.essence += 20;
          this.game.fame += 20;
          this.message = 'Expedição concluída! +75 ouro · +20 essência. Retorne ao mapa.';
          log(this.game, 'Expedição concluída. A região está mais segura.', 'combat');
          this.commit();
        }
      }
    }
    if (
      alive.length === 0 &&
      !this.finished &&
      !this.chest &&
      (!this.dungeon || !['rest', 'treasure'].includes(this.dungeon.rooms[this.dungeon.room]))
    )
      this.message = 'Área segura. Siga pela estrada até o portal à direita e pressione E.';
    this.publish(dt);
  }
  private publish(dt: number) {
    this.hudTimer += dt;
    if (this.hudTimer < 0.1) return;
    this.hudTimer = 0;
    const p = this.game.player;
    this.onHud({
      hp: p.hp,
      mana: p.mana,
      stamina: p.stamina,
      kills: p.kills,
      total: this.enemies.filter((e) => e.hp > 0).length,
      cooldowns: [...this.cooldowns],
      paused: this.paused,
      message: this.message,
      room: this.dungeon
        ? `Sala ${this.dungeon.room + 1}/${this.dungeon.rooms.length} · ${this.dungeon.modifier}`
        : 'Marcas do reino · exploração livre',
      boss: this.enemies.some((e) => e.boss && e.hp > 0)
        ? BOSSES[this.map.seed % BOSSES.length]
        : '',
      xp: p.xp,
      level: p.level,
    });
  }
  private draw() {
    const ctx = this.canvas.getContext('2d')!;
    const w = this.canvas.width,
      h = this.canvas.height;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#152522';
    ctx.fillRect(0, 0, w, h);
    this.camera.x = Math.max(0, Math.min(B.zoneWidth * B.tile - w, this.x - w / 2));
    this.camera.y = Math.max(0, Math.min(B.zoneHeight * B.tile - h, this.y - h / 2));
    ctx.save();
    ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));
    const biome = regionById(this.game.world.region).biome;
    const frozen = biome === 'Gelo',
      dark = biome === 'Abismo' || biome === 'Cripta',
      sand = biome === 'Deserto' || biome === 'Vulcão';
    const grass = frozen ? '#657e7e' : dark ? '#302e42' : sand ? '#6c5943' : '#304936';
    const path = frozen ? '#91a9a1' : dark ? '#494454' : sand ? '#9a7a53' : '#827552';
    for (
      let ty = Math.floor(this.camera.y / 16);
      ty < Math.min(B.zoneHeight, Math.ceil((this.camera.y + h) / 16));
      ty++
    ) {
      for (
        let tx = Math.floor(this.camera.x / 16);
        tx < Math.min(B.zoneWidth, Math.ceil((this.camera.x + w) / 16));
        tx++
      ) {
        const t = this.map.tiles[ty * B.zoneWidth + tx];
        ctx.fillStyle = t === 0 ? path : grass;
        ctx.fillRect(tx * 16, ty * 16, 16, 16);
        const n = (tx * 73 + ty * 127 + this.map.seed) % 17;
        ctx.fillStyle = t === 0 ? '#c6b78735' : '#bed28720';
        ctx.fillRect(tx * 16 + (n % 12), ty * 16 + (n % 9), 2, 1);
        if (n < 4 && t === 1) {
          ctx.fillStyle = '#a7c38445';
          ctx.fillRect(tx * 16 + 6, ty * 16 + 7, 1, 3);
        }
      }
    }
    const portal = (x: number, label: string) => {
      ctx.strokeStyle = '#8bd5ce';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, 310, 12, 22, 0, 0, 7);
      ctx.stroke();
      ctx.fillStyle = '#78d3c533';
      ctx.fill();
      ctx.fillStyle = '#e4e2bb';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, 344);
    };
    portal(128, 'E · VOLTAR');
    portal(850, 'E · PORTAL');
    for (const e of this.enemies)
      if (e.hp > 0 && e.telegraph > 0) {
        ctx.fillStyle = '#dd725749';
        ctx.strokeStyle = '#f1a07a';
        ctx.beginPath();
        ctx.arc(e.targetX, e.targetY, e.boss ? 55 : 32, 0, 7);
        ctx.fill();
        ctx.stroke();
      }
    const drawables: { y: number; draw: () => void }[] = [];
    for (let i = 0; i < this.map.tiles.length; i++) {
      const x = (i % B.zoneWidth) * 16,
        y = Math.floor(i / B.zoneWidth) * 16;
      if (
        x < this.camera.x - 25 ||
        x > this.camera.x + w + 25 ||
        y < this.camera.y - 20 ||
        y > this.camera.y + h + 50
      )
        continue;
      if (this.map.tiles[i] === 2)
        drawables.push({
          y,
          draw: () =>
            drawTree(
              ctx,
              x + 8,
              y + 12,
              1,
              frozen ? '#8ba9a0' : dark ? '#4d4660' : sand ? '#766044' : '#42684a',
            ),
        });
      if (this.map.tiles[i] === 3)
        drawables.push({
          y,
          draw: () => {
            ctx.fillStyle = '#666e61';
            ctx.fillRect(x + 1, y + 3, 14, 11);
            ctx.fillStyle = '#8f9680';
            ctx.fillRect(x + 3, y + 3, 8, 4);
          },
        });
    }
    for (const e of this.enemies)
      if (e.hp > 0)
        drawables.push({
          y: e.y,
          draw: () => {
            drawMonster(ctx, e.x, e.y, e.type, this.time, e.boss);
            ctx.fillStyle = '#1c2228';
            ctx.fillRect(e.x - 13, e.y - (e.boss ? 59 : 33), 26, 3);
            ctx.fillStyle = e.boss ? '#d5a566' : '#c78272';
            ctx.fillRect(e.x - 13, e.y - (e.boss ? 59 : 33), (26 * e.hp) / e.maxHp, 3);
          },
        });
    for (const c of this.companions)
      drawables.push({ y: c.y, draw: () => drawHero(ctx, c.x, c.y, c.c, this.time * 9) });
    drawables.push({
      y: this.y,
      draw: () => {
        ctx.globalAlpha = this.dodge > 0 ? 0.55 : 1;
        drawHero(
          ctx,
          this.x,
          this.y,
          this.game.player,
          this.time * (this.input.held.size ? 10 : 0),
          1,
          this.facing,
        );
        ctx.globalAlpha = 1;
        if (this.slash > 0) {
          ctx.strokeStyle = '#f4e4ad';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(this.x, this.y - 8, 24, -1.2, 1.2);
          ctx.stroke();
        }
      },
    });
    drawables.sort((a, b) => a.y - b.y).forEach((d) => d.draw());
    for (const sh of this.shots) {
      ctx.fillStyle = sh.hostile
        ? '#ed9b83'
        : ELEMENT_COLORS[ELEMENTS.indexOf(this.game.player.grimoire.element)];
      ctx.fillRect(sh.x - 3, sh.y - 3, 6, 6);
    }
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    for (const p of this.particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    const gradient = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, w * 0.65);
    gradient.addColorStop(0, '#05151900');
    gradient.addColorStop(1, this.dungeon?.modifier === 'Escuridão' ? '#07151bee' : '#07151b88');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    if (this.dungeon?.modifier === 'Névoa') {
      ctx.fillStyle = '#c0d0b833';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.fillStyle = '#0b181acc';
    ctx.fillRect(w - 128, 12, 116, 80);
    for (let i = 0; i < this.map.tiles.length; i++)
      if (this.map.tiles[i] < 2) {
        ctx.fillStyle = this.map.tiles[i] === 0 ? '#92886b' : '#43634c';
        ctx.fillRect(w - 126 + (i % 60) * 1.85, 14 + Math.floor(i / 60) * 1.85, 1.85, 1.85);
      }
    ctx.fillStyle = '#f4df9f';
    ctx.fillRect(w - 126 + (this.x / 16) * 1.85 - 1, 14 + (this.y / 16) * 1.85 - 1, 3, 3);
  }
}
