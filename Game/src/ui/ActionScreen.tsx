import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Pause, Play, Swords } from 'lucide-react';
import { ActionEngine, type ActionHud } from '../engine/action';
import { CLASSES } from '../data/classes';
import { stats, xpNeeded } from '../systems/stats';
import { getGame, replaceGame } from '../state/store';
import { Meter } from './components';
export function ActionScreen({ dungeon, onExit }: { dungeon: boolean; onExit: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null),
    engine = useRef<ActionEngine | null>(null),
    [hud, setHud] = useState<ActionHud | null>(null);
  useEffect(() => {
    const e = new ActionEngine(canvas.current!, getGame()!, dungeon, setHud, replaceGame, onExit);
    engine.current = e;
    canvas.current!.focus();
    return () => {
      e.stop();
      engine.current = null;
    };
  }, []);
  const g = engine.current?.game ?? getGame()!,
    p = g.player,
    s = stats(p),
    cls = CLASSES.find((c) => c.id === p.classId)!;
  const togglePause = () => {
    engine.current?.togglePause();
    canvas.current?.focus();
  };
  return (
    <div className="action-screen">
      <div className="section-line">
        <div>
          <span className="eyebrow">EXPEDIÇÃO EM ANDAMENTO</span>
          <h2>{dungeon ? 'Além do portal' : 'Nas marcas do reino'}</h2>
        </div>
        <div className="button-row">
          <button
            onClick={() => {
              engine.current?.stop();
              onExit();
            }}
          >
            <ArrowLeft size={15} /> Retornar ao mapa
          </button>
          <button onClick={togglePause}>
            {hud?.paused ? <Play size={15} /> : <Pause size={15} />}{' '}
            {hud?.paused ? 'Retomar' : 'Pausar'}
          </button>
        </div>
      </div>
      <div className="action-frame">
        <canvas
          width={800}
          height={450}
          ref={canvas}
          tabIndex={0}
          aria-label="Zona de combate. WASD move, J ataca, espaço esquiva, 1 a 4 habilidades, E interage."
        />
        <div className="action-location">
          <span className="live-dot" />
          {hud?.room ?? 'Preparando expedição'}
        </div>
        {hud?.paused && (
          <div className="pause-overlay">
            <span className="eyebrow">O TEMPO ESTÁ EM SUAS MÃOS</span>
            <h2>Jornada pausada</h2>
            <p>P ou Tab para continuar</p>
            <button className="primary" onClick={togglePause}>
              Retomar expedição
            </button>
          </div>
        )}
        <div className="action-status">
          <Swords size={14} />
          {hud?.total ?? 0} ameaças na área
        </div>
      </div>
      <div className="combat-hud">
        <div className="vitals">
          <Meter
            label={`Vida · Nível ${hud?.level ?? p.level}`}
            value={hud?.hp ?? p.hp}
            max={s.hp}
            color="#b98178"
          />
          <Meter label="Mana" value={hud?.mana ?? p.mana} max={s.mana} color="#729db8" />
          <Meter
            label="Stamina"
            value={hud?.stamina ?? p.stamina}
            max={s.stamina}
            color="#b5aa73"
          />
        </div>
        <div className="skill-bar">
          {cls.skills.map((name, i) => (
            <button
              key={name}
              onClick={() => {
                engine.current?.trigger(String(i + 1));
                canvas.current?.focus();
              }}
              disabled={(hud?.cooldowns[i] ?? 0) > 0}
            >
              <kbd>{i + 1}</kbd>
              <span className="skill-glyph">{['✧', '◈', '✚', '✵'][i]}</span>
              <small>{name}</small>
              {(hud?.cooldowns[i] ?? 0) > 0 && <b>{Math.ceil(hud!.cooldowns[i])}s</b>}
            </button>
          ))}
        </div>
        <div className="combat-xp">
          <span className="eyebrow">EXPERIÊNCIA</span>
          <Meter value={hud?.xp ?? p.xp} max={xpNeeded(hud?.level ?? p.level)} color="#c7ad77" />
          <small>
            {hud?.xp ?? p.xp} / {xpNeeded(hud?.level ?? p.level)} XP
          </small>
        </div>
      </div>
      <div className="action-message" aria-live="polite">
        {hud?.message}
      </div>
      <div className="key-guide">
        <span>
          <kbd>W A S D</kbd> Mover
        </span>
        <span>
          <kbd>J</kbd> / clique · Atacar
        </span>
        <span>
          <kbd>ESPAÇO</kbd> Esquivar
        </span>
        <span>
          <kbd>E</kbd> Interagir
        </span>
        <span>
          <kbd>P</kbd> Pausar
        </span>
      </div>
    </div>
  );
}
