import { useEffect, useRef, useState } from 'react';
import { Crown, Lock, Swords, Shield, Pause, Play, Flag, Hammer } from 'lucide-react';
import { B } from '../data/balance';
import { BUILDINGS } from '../data/content';
import { regionById } from '../data/regions';
import { rankIndex, power } from '../systems/stats';
import { battleTick } from '../systems/battle';
import { addSquad, build } from '../systems/actions';
import { advanceDays, log } from '../systems/worldSim';
import { updateGame } from '../state/store';
import type { SaveGame, Squad, SquadType } from '../state/types';
import { Empty, Meter } from './components';
const squadTypes: SquadType[] = ['Vanguarda', 'Guardião', 'Ranger', 'Mágico', 'Monstros'];
export function ArmyScreen({ game: g }: { game: SaveGame }) {
  const [battle, setBattle] = useState<{
      allies: Squad[];
      enemies: Squad[];
      won: boolean;
      lost: boolean;
    } | null>(null),
    [paused, setPaused] = useState(false),
    [scenario, setScenario] = useState(0);
  const settled = useRef(false),
    unlocked = rankIndex(power(g.player)) >= 2;
  const lastBattle = useRef(battle);
  lastBattle.current = battle;
  useEffect(
    () => () => {
      const ongoing = lastBattle.current;
      if (ongoing && !settled.current) {
        updateGame((d) => {
          d.squads = ongoing.allies.filter((s) => s.count > 0);
          log(d, 'Retirada ao deixar o campo de batalha. Baixas preservadas.', 'combat');
        });
      }
    },
    [],
  );
  useEffect(() => {
    if (!battle || paused || battle.won || battle.lost) return;
    const timer = setInterval(
      () =>
        setBattle((prev) =>
          prev ? battleTick(prev.allies, prev.enemies, 1 + (g.research.Militar ?? 0) * 0.05) : prev,
        ),
      B.battleStep * 1000,
    );
    return () => clearInterval(timer);
  }, [battle, paused, g.research.Militar]);
  useEffect(() => {
    if (!battle || (!battle.won && !battle.lost) || settled.current) return;
    settled.current = true;
    updateGame((d) => {
      d.squads = battle.allies.filter((s) => s.count > 0);
      if (battle.won) {
        d.gold += 120;
        d.fame += 40;
        d.party.forEach((c) => (c.loyalty = Math.min(100, c.loyalty + 5)));
        if (rankIndex(power(d.player)) >= 3 && !d.territories.some((t) => t.id === d.world.region))
          d.territories.push({
            id: d.world.region,
            name: `Vila de ${regionById(d.world.region).name}`,
            tier: 0,
            stability: 80,
            tax: 10,
            buildings: { Fazenda: 1 },
          });
      }
      log(
        d,
        battle.won
          ? 'Vitória do batalhão. A região reconhece sua força.'
          : 'O batalhão recuou. As baixas foram registradas.',
        'combat',
      );
    });
  }, [battle]);
  const begin = () => {
    settled.current = false;
    setPaused(false);
    setBattle({
      allies: structuredClone(g.squads),
      enemies: [
        {
          id: 'enemy-1',
          type: (['Ranger', 'Guardião', 'Mágico'] as const)[scenario],
          count: 24 + scenario * 5,
          morale: 90,
          officer: null,
          order: scenario === 1 ? 'Defender' : 'Atacar',
        },
        { id: 'enemy-2', type: 'Vanguarda', count: 18, morale: 85, officer: null, order: 'Atacar' },
      ],
      won: false,
      lost: false,
    });
  };
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">A FORÇA DE MUITOS, UMA SÓ VONTADE</span>
        <h1>Batalhão</h1>
        <p>
          Tempo real com pausa. Vanguarda vence Ranger, Ranger vence Mágico, Mágico vence Vanguarda.
        </p>
      </div>
      {!unlocked ? (
        <section className="panel">
          <Empty symbol="♜" title="O comando se conquista">
            Alcance Rank C (250 PW) para formar esquadrões. No Rank B, vitórias capturam uma vila na
            região atual.
          </Empty>
          <Meter label="Poder para Rank C" value={power(g.player)} max={250} color="#c4ac78" />
        </section>
      ) : (
        <>
          {!battle ? (
            <>
              <div className="panel section-line">
                <div>
                  <h3>Recrutar tropas</h3>
                  <p className="muted">20 soldados por esquadrão · até 5 esquadrões nesta versão</p>
                </div>
                <div className="button-row wrap">
                  {squadTypes.map((t) => (
                    <button
                      disabled={g.gold < B.squadCost || g.squads.length >= 5}
                      key={t}
                      onClick={() => updateGame((d) => addSquad(d, t))}
                    >
                      {t} · {B.squadCost}
                    </button>
                  ))}
                </div>
              </div>
              <div className="squad-grid mt">
                {g.squads.map((s) => (
                  <section className="panel" key={s.id}>
                    <Shield size={30} />
                    <h3>{s.type}</h3>
                    <h2>
                      {s.count} <small>soldados</small>
                    </h2>
                    <Meter label="Moral" value={s.morale} max={100} />
                    <label className="field-label">
                      Oficial
                      <select
                        value={s.officer ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          updateGame((d) => {
                            d.squads.find((x) => x.id === s.id)!.officer = v || null;
                          });
                        }}
                      >
                        <option value="">Sem oficial</option>
                        {g.party.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="full"
                      disabled={g.gold < 20}
                      onClick={() =>
                        updateGame((d) => {
                          const sq = d.squads.find((x) => x.id === s.id);
                          if (sq && d.gold >= 20) {
                            d.gold -= 20;
                            sq.count = Math.min(30, sq.count + 10);
                            sq.morale = 100;
                          }
                        })
                      }
                    >
                      Reforçar +10 · 20 ouro
                    </button>
                  </section>
                ))}
              </div>
              <div className="panel section-line mt">
                <select
                  aria-label="Cenário de batalha"
                  value={scenario}
                  onChange={(e) => setScenario(Number(e.target.value))}
                >
                  <option value={0}>Defesa de vila</option>
                  <option value={1}>Cerco à fortaleza</option>
                  <option value={2}>Emboscada na floresta</option>
                </select>
                <button className="primary" disabled={!g.squads.length} onClick={begin}>
                  <Swords size={16} /> Iniciar batalha
                </button>
              </div>
            </>
          ) : (
            <div className="panel">
              <div className="section-line">
                <h2>
                  {battle.won
                    ? 'Vitória conquistada'
                    : battle.lost
                      ? 'Retirada do batalhão'
                      : 'Campo de batalha'}
                </h2>
                <button onClick={() => setPaused(!paused)} disabled={battle.won || battle.lost}>
                  {paused ? <Play size={14} /> : <Pause size={14} />}{' '}
                  {paused ? 'Retomar' : 'Pausar'}
                </button>
              </div>
              <div className="battle-field">
                <div>
                  {battle.allies.map((s) => (
                    <div className="battle-piece allied" key={s.id}>
                      <Shield />
                      <strong>{s.type}</strong>
                      <b>{s.count}</b>
                      <Meter value={s.morale} max={100} />
                      <select
                        aria-label={`Ordem ${s.type}`}
                        value={s.order}
                        disabled={battle.won || battle.lost}
                        onChange={(e) => {
                          const v = e.target.value;
                          setBattle((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  allies: prev.allies.map((a) =>
                                    a.id === s.id ? { ...a, order: v } : a,
                                  ),
                                }
                              : prev,
                          );
                        }}
                      >
                        {['Atacar', 'Defender', 'Cercar', 'Recuar'].map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <Swords className="battle-cross" size={40} />
                <div>
                  {battle.enemies.map((s) => (
                    <div className="battle-piece enemy" key={s.id}>
                      <Flag />
                      <strong>{s.type}</strong>
                      <b>{s.count}</b>
                      <Meter value={s.morale} max={100} color="#bd8176" />
                    </div>
                  ))}
                </div>
              </div>
              {battle.won || battle.lost ? (
                <button className="primary full" onClick={() => setBattle(null)}>
                  Encerrar batalha · baixas registradas
                </button>
              ) : (
                <button className="full" onClick={() => setBattle({ ...battle, lost: true })}>
                  Ordenar retirada geral
                </button>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
export function KingdomScreen({ game: g }: { game: SaveGame }) {
  const unlocked = rankIndex(power(g.player)) >= 3,
    [tab, setTab] = useState('Territórios');
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">DA ESPADA À COROA</span>
        <h1>Seu domínio</h1>
        <p>Produza recursos, fortaleça sua influência e encontre seu lugar entre os seis reinos.</p>
      </div>
      <div className="resource-grid">
        {Object.entries(g.resources).map(([k, v]) => (
          <div className="panel" key={k}>
            <span className="eyebrow">{k}</span>
            <h2>{v}</h2>
          </div>
        ))}
      </div>
      <div className="tab-bar">
        {['Territórios', 'Pesquisa', 'Diplomacia'].map((t) => (
          <button className={tab === t ? 'active' : ''} key={t} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      {!unlocked ? (
        <section className="panel">
          <Empty symbol="♛" title="Uma coroa começa com uma vila">
            Alcance Rank B (500 PW) e vença uma batalha para conquistar seu primeiro território.
          </Empty>
        </section>
      ) : tab === 'Territórios' ? (
        <>
          {!g.territories.length ? (
            <Empty title="Terras à sua espera">
              Vença uma batalha na tela Batalhão para fundar sua primeira vila.
            </Empty>
          ) : (
            g.territories.map((t) => (
              <section className="panel mt" key={t.id}>
                <div className="section-line">
                  <div>
                    <span className="eyebrow">
                      {['Vila', 'Cidade', 'Fortaleza', 'Capital'][t.tier]} ·{' '}
                      {Object.keys(t.buildings).length}/{(t.tier + 1) * 3} construções
                    </span>
                    <h2>{t.name}</h2>
                  </div>
                  <button
                    disabled={t.tier >= 3 || g.gold < 300 * (t.tier + 1)}
                    onClick={() =>
                      updateGame((d) => {
                        const terr = d.territories.find((v) => v.id === t.id)!;
                        const cost = 300 * (terr.tier + 1);
                        if (terr.tier < 3 && d.gold >= cost) {
                          d.gold -= cost;
                          terr.tier++;
                        }
                      })
                    }
                  >
                    Expandir · {300 * (t.tier + 1)} ouro
                  </button>
                </div>
                <Meter label="Estabilidade" value={t.stability} max={100} />
                <label className="field-label">
                  Tributo: {t.tax}%
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={t.tax}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      updateGame((d) => {
                        d.territories.find((v) => v.id === t.id)!.tax = value;
                      });
                    }}
                  />
                </label>
                <div className="build-grid">
                  {BUILDINGS.map((name) => {
                    const level = t.buildings[name] ?? 0,
                      cost = Math.round(B.buildingCost * B.buildingGrowth ** level);
                    return (
                      <button
                        key={name}
                        disabled={
                          g.gold < cost ||
                          level >= 5 ||
                          (!level && Object.keys(t.buildings).length >= (t.tier + 1) * 3)
                        }
                        onClick={() => updateGame((d) => build(d, t.id, name))}
                      >
                        <Hammer size={16} />
                        <strong>{name}</strong>
                        <small>
                          {level ? `Nível ${level}` : 'Construir'} · {cost} ouro
                        </small>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
          <button className="mt" onClick={() => updateGame((d) => advanceDays(d, 1))}>
            Administrar por um dia · produzir e pagar salários
          </button>
        </>
      ) : tab === 'Pesquisa' ? (
        <div className="shop-grid">
          {Object.keys(g.research).map((name) => (
            <section className="panel" key={name}>
              <span className="eyebrow">PESQUISA</span>
              <h2>{name}</h2>
              <p>Nível {g.research[name]} / 5</p>
              <p className="muted">
                {name === 'Militar'
                  ? '+5% de força tática por nível'
                  : name === 'Economia'
                    ? '+5% de produção por nível'
                    : 'Base de pesquisa; efeitos avançados previstos na expansão.'}
              </p>
              <button
                disabled={
                  g.gold < B.researchCost * (g.research[name] + 1) ||
                  g.research[name] >= 5 ||
                  ['Magia', 'Diplomacia'].includes(name)
                }
                onClick={() =>
                  updateGame((d) => {
                    const cost = B.researchCost * (d.research[name] + 1);
                    if (d.gold >= cost && d.research[name] < 5) {
                      d.gold -= cost;
                      d.research[name]++;
                    }
                  })
                }
              >
                Pesquisar · {B.researchCost * (g.research[name] + 1)}
              </button>
            </section>
          ))}
        </div>
      ) : rankIndex(power(g.player)) < 4 ? (
        <Empty symbol="♛" title="Diplomacia requer Rank A">
          Aumente seu Poder para 900 antes de negociar em nome do reino.
        </Empty>
      ) : (
        <div className="quest-grid">
          {g.kingdoms.map((k) => (
            <section className="panel" key={k.id}>
              <Crown size={23} />
              <h2>{regionById(k.id).name}</h2>
              <p>
                Relação {k.relation} · {k.war ? 'Em guerra' : k.policy}
              </p>
              <p className="muted">
                Exército {k.military} · Riqueza {k.wealth}
              </p>
              <div className="button-row wrap">
                <button
                  disabled={g.gold < 50}
                  onClick={() =>
                    updateGame((d) => {
                      if (d.gold >= 50) {
                        d.gold -= 50;
                        const kingdom = d.kingdoms.find((v) => v.id === k.id)!;
                        kingdom.relation = Math.min(100, kingdom.relation + 15);
                        if (kingdom.relation >= 30) kingdom.war = false;
                      }
                    })
                  }
                >
                  Enviar tributo · 50
                </button>
                <button
                  onClick={() =>
                    updateGame((d) => {
                      const kingdom = d.kingdoms.find((v) => v.id === k.id)!;
                      kingdom.war = !kingdom.war;
                      kingdom.relation = kingdom.war ? -60 : 0;
                      log(
                        d,
                        `${kingdom.war ? 'Guerra declarada contra' : 'Trégua proposta a'} ${regionById(k.id).name}.`,
                      );
                    })
                  }
                >
                  {k.war ? 'Propor trégua' : 'Declarar guerra'}
                </button>
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
