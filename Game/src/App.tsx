import { useRef, useState } from 'react';
import {
  Compass,
  UserRound,
  BookOpen,
  Backpack,
  Users,
  Swords,
  Crown,
  ScrollText,
  Settings,
  Coins,
  Sparkles,
  Sun,
  ChevronRight,
  ArrowUpRight,
  MapPin,
  Castle,
  Trees,
  DoorOpen,
  Play,
  Upload,
  Menu,
  X,
  Flag,
} from 'lucide-react';
import { useGame, updateGame, getSaveError, getGame, replaceGame } from './state/store';
import type { Region, Screen } from './state/types';
import { B } from './data/balance';
import { REGIONS, regionById } from './data/regions';
import { QUESTS } from './data/content';
import { raceById } from './data/races';
import { classById } from './data/classes';
import { power, xpNeeded } from './systems/stats';
import { travel, questProgress } from './systems/actions';
import { parseSave } from './systems/save';
import { WorldMap } from './ui/WorldMap';
import { CreateCharacter } from './ui/CreateCharacter';
import { CharacterScreen, GrimoireScreen, InventoryScreen } from './ui/CharacterScreens';
import { CityScreen, CompanyScreen } from './ui/CityScreens';
import { ArmyScreen, KingdomScreen } from './ui/StrategyScreens';
import { SettingsScreen } from './ui/SettingsScreen';
import { ActionScreen } from './ui/ActionScreen';
import { Meter, Modal, Rank, Sprite } from './ui/components';
const nav: { id: Screen; label: string; icon: typeof Compass; section?: string }[] = [
  { id: 'world', label: 'Mapa-múndi', icon: Compass, section: 'EXPLORAR' },
  { id: 'city', label: 'Cidade', icon: Castle },
  { id: 'character', label: 'Personagem', icon: UserRound, section: 'SEU LEGADO' },
  { id: 'grimoire', label: 'Grimório', icon: BookOpen },
  { id: 'inventory', label: 'Inventário', icon: Backpack },
  { id: 'company', label: 'Companhia', icon: Users },
  { id: 'army', label: 'Batalhão', icon: Swords, section: 'CONQUISTAR' },
  { id: 'kingdom', label: 'Reino', icon: Crown },
  { id: 'journal', label: 'Diário do mundo', icon: ScrollText },
];
export default function App() {
  const game = useGame(),
    [mode, setMode] = useState<'menu' | 'create' | 'game'>('menu'),
    [screen, setScreen] = useState<Screen>('world'),
    [selected, setSelected] = useState(game?.world.region ?? 'region-0'),
    [dungeon, setDungeon] = useState(false),
    [mobile, setMobile] = useState(false),
    [newConfirm, setNewConfirm] = useState(false),
    [info, setInfo] = useState(''),
    [logFilter, setLogFilter] = useState('all');
  const file = useRef<HTMLInputElement>(null);
  const start = () => {
    if (game) setNewConfirm(true);
    else setMode('create');
  };
  const selectScreen = (s: Screen) => {
    setScreen(s);
    setMobile(false);
  };
  if (mode === 'create')
    return (
      <CreateCharacter
        onBack={() => setMode('menu')}
        onDone={() => {
          setSelected(getGame()!.world.region);
          setMode('game');
          setScreen('world');
        }}
      />
    );
  if (mode === 'menu' || !game)
    return (
      <div className="landing">
        <WorldMap selected="" decorative />
        <div className="landing-vignette" />
        <header className="landing-header">
          <span className="brand-mark">♜</span>
          <span className="eyebrow">UM MUNDO VIVO. UM DESTINO SEU.</span>
          <span className="version">PRÉVIA JOGÁVEL · 0.1</span>
        </header>
        <main className="landing-main">
          <div className="ornament">✧ ───────── ✧</div>
          <span className="eyebrow">AS CRÔNICAS DE UMA NOVA ERA</span>
          <h1>
            ETERNAL
            <br />
            <span>REALMS</span>
          </h1>
          <div className="landing-subtitle">
            <i />
            ASCENSÃO DOS REINOS
            <i />
          </div>
          <p>
            Comece com uma espada.
            <br />
            Deixe um império como legado.
          </p>
          <div className="landing-buttons">
            {game && (
              <button
                className="primary"
                onClick={() => {
                  setMode('game');
                  setSelected(game.world.region);
                }}
              >
                <Play size={17} /> Continuar jornada <ChevronRight size={16} />
              </button>
            )}
            <button className={game ? '' : 'primary'} onClick={start}>
              <Swords size={17} />
              {game ? 'Nova jornada' : 'Iniciar jornada'}
              <ChevronRight size={16} />
            </button>
            <button className="text-button" onClick={() => file.current?.click()}>
              <Upload size={14} /> Importar progresso
            </button>
          </div>
          {game && (
            <span className="muted">
              {game.player.name} · Nível {game.player.level} · Dia {game.world.day}
            </span>
          )}
          <p className="error" role="status">
            {info || getSaveError()}
          </p>
        </main>
        <footer className="landing-footer">
          <span>RPG DE AÇÃO & ESTRATÉGIA</span>
          <span>
            24 LINHAGENS <b>·</b> 16 REGIÕES <b>·</b> SEU LEGADO
          </span>
          <span>FEITO PARA EXPLORAR</span>
        </footer>
        <input
          hidden
          ref={file}
          type="file"
          accept=".json"
          onChange={async (e) => {
            try {
              const f = e.target.files?.[0];
              if (f) {
                if (f.size > 4_000_000) throw new Error('Arquivo muito grande');
                const g = parseSave(await f.text());
                replaceGame(g);
                setSelected(g.world.region);
                setMode('game');
              }
            } catch (err) {
              setInfo(err instanceof Error ? err.message : 'Save inválido');
            }
            e.target.value = '';
          }}
        />
        {newConfirm && (
          <Modal title="Uma nova história" onClose={() => setNewConfirm(false)}>
            <p>
              Seu progresso atual será substituído ao concluir a criação. Você pode exportá-lo em
              Configurações antes de começar.
            </p>
            <button
              className="primary full"
              onClick={() => {
                setNewConfirm(false);
                setMode('create');
              }}
            >
              Criar novo personagem
            </button>
          </Modal>
        )}
      </div>
    );
  const g = game,
    p = g.player,
    r = regionById(selected),
    current = regionById(g.world.region);
  const goZone = (isDungeon: boolean) => {
    updateGame((d) => {
      d.world.node = current.nodes[isDungeon ? 2 : 1].id;
    });
    setDungeon(isDungeon);
    setScreen('zone');
  };
  const mission = QUESTS.find((q) => g.quests.active.includes(q.id));
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? 'open' : ''}`}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setMode('menu');
          }}
        >
          <span className="brand-mark">♜</span>
          <div>
            ETERNAL<span>REALMS</span>
            <small>ASCENSÃO DOS REINOS</small>
          </div>
        </a>
        <button
          className="mobile-close icon-button"
          onClick={() => setMobile(false)}
          aria-label="Fechar navegação"
        >
          <X />
        </button>
        <nav>
          {nav.map((n) => (
            <div key={n.id}>
              {n.section && <span className="nav-section">{n.section}</span>}
              <button
                className={screen === n.id ? 'active' : ''}
                onClick={() => selectScreen(n.id)}
              >
                <n.icon size={17} strokeWidth={1.5} />
                <span>{n.label}</span>
                {n.id === 'inventory' && g.inventory.length > 0 && (
                  <small>{g.inventory.length}</small>
                )}
                {n.id === 'character' && p.points > 0 && <i className="notification-dot" />}
              </button>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="world-clock">
            <span className="live-dot" />
            <span>O mundo está vivo</span>
            <small>Dia {g.world.day}</small>
          </div>
          <button
            className={screen === 'settings' ? 'active' : ''}
            onClick={() => selectScreen('settings')}
          >
            <Settings size={16} /> Configurações
          </button>
          <div className="sidebar-player">
            <Sprite character={p} size={48} />
            <div>
              <strong>{p.name}</strong>
              <small>
                Nível {p.level} · {classById(p.classId).name}
              </small>
            </div>
            <Rank character={p} />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            onClick={() => setMobile(!mobile)}
            aria-label="Abrir navegação"
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            Ascensão dos Reinos <ChevronRight size={12} />
            <strong>
              {screen === 'zone'
                ? 'Expedição'
                : (nav.find((n) => n.id === screen)?.label ?? 'Configurações')}
            </strong>
          </div>
          <div className="top-resources">
            <span title="Ouro">
              <Coins size={15} />
              <b>{g.gold.toLocaleString('pt-BR')}</b>
            </span>
            <span title="Essência">
              <Sparkles size={15} />
              <b>{g.essence}</b>
            </span>
            <span title="Fama">
              <Flag size={14} />
              <b>{g.fame}</b>
            </span>
            <i />
            <span>
              <Sun size={16} />
              <b>Dia {g.world.day}</b>
            </span>
          </div>
        </header>
        {getSaveError() && (
          <div className="save-error" role="alert">
            {getSaveError()}
          </div>
        )}
        <main className={`main-content ${screen === 'world' ? 'world-content' : ''}`}>
          {screen === 'world' ? (
            <>
              <div className="page-heading world-heading">
                <div>
                  <span className="eyebrow">CADA CAMINHO ESCREVE UMA HISTÓRIA</span>
                  <h1>
                    Um mundo à sua espera<span className="heading-dot">.</span>
                  </h1>
                  <p>Das marcas de um reino aos limites do desconhecido.</p>
                </div>
                <div className="world-season">
                  <Sun size={20} />
                  <div>
                    <span>Era da Aurora</span>
                    <small>Primavera · Dia {g.world.day}</small>
                  </div>
                </div>
              </div>
              <div className="world-layout">
                <section className="map-panel">
                  <div className="map-topline">
                    <span>
                      <Compass size={14} /> ATLAS DOS REINOS
                    </span>
                    <span>
                      16 REGIÕES <i /> 6 REINOS
                    </span>
                  </div>
                  <WorldMap
                    selected={r.id}
                    current={g.world.region}
                    onSelect={(region: Region) => setSelected(region.id)}
                  />
                  <div className="map-bottomline">
                    <span>
                      <span className="live-dot" /> {current.name} · {current.capital}
                    </span>
                    <span>Clique em uma região para explorar</span>
                  </div>
                </section>
                <aside className="region-panel">
                  <div
                    className="region-art"
                    style={{ '--region-color': r.color } as React.CSSProperties}
                  >
                    <div className="region-sun" />
                    <div className="mountains back" />
                    <div className="mountains" />
                    <Castle size={65} strokeWidth={0.8} />
                    <span className="region-type">
                      {r.kingdom ? 'REINO SOBERANO' : 'TERRITÓRIO LIVRE'}
                    </span>
                  </div>
                  <div className="region-detail">
                    <span className="eyebrow">
                      {r.biome.toUpperCase()} · NÍVEL {r.level}+
                    </span>
                    <h2>{r.name}</h2>
                    <p>
                      {r.id === g.world.region
                        ? 'As estradas se abrem diante de você. Escolha sua próxima expedição.'
                        : 'Um novo horizonte aguarda. Viajar avança o mundo em um dia.'}
                    </p>
                    <div className="region-facts">
                      <span>
                        <Castle size={14} /> Capital <b>{r.capital}</b>
                      </span>
                      <span>
                        <ShieldIcon /> Ameaça{' '}
                        <b>{(g.world.danger[r.id] ?? 0) >= 7 ? 'Ruptura ativa' : 'Estável'}</b>
                      </span>
                    </div>
                    {r.id === g.world.region ? (
                      <div className="location-actions">
                        <button onClick={() => setScreen('city')}>
                          <Castle size={16} />
                          <span>
                            Visitar a cidade<small>Guilda, taverna e serviços</small>
                          </span>
                          <ChevronRight size={14} />
                        </button>
                        <button onClick={() => goZone(false)}>
                          <Trees size={16} />
                          <span>
                            Explorar as marcas<small>Combate, recursos e descobertas</small>
                          </span>
                          <ChevronRight size={14} />
                        </button>
                        <button className="dungeon-button" onClick={() => goZone(true)}>
                          <DoorOpen size={16} />
                          <span>
                            Entrar na dungeon<small>{r.nodes[2].name}</small>
                          </span>
                          <ArrowUpRight size={15} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="travel-note">
                          {r.level > p.level + 10
                            ? 'Região perigosa para seu nível. Viajar à cidade é seguro; as zonas exigem preparo.'
                            : 'Novos aliados e desafios esperam por você.'}
                        </p>
                        <button
                          className="primary full"
                          onClick={() => updateGame((d) => travel(d, r.id))}
                        >
                          <Compass size={16} /> Viajar · 1 dia
                          <ChevronRight size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </aside>
              </div>
              <div className="world-bottom">
                <section className="panel journey-card">
                  <div className="section-line">
                    <span className="eyebrow">SUA JORNADA</span>
                    <button className="text-button" onClick={() => setScreen('character')}>
                      Ver personagem <ArrowUpRight size={13} />
                    </button>
                  </div>
                  <div className="journey-hero">
                    <Sprite character={p} size={60} />
                    <div>
                      <h3>{p.name}</h3>
                      <p>
                        {raceById(p.race).name} · {classById(p.classId).name} · Nível {p.level}
                      </p>
                    </div>
                    <div className="journey-rank">
                      <Rank character={p} />
                      <small>{power(p)} PW</small>
                    </div>
                  </div>
                  <Meter value={p.xp} max={xpNeeded(p.level)} color="#c7ad77" />
                </section>
                <section className="panel mission-card">
                  <span className="eyebrow">CONTRATO ATIVO</span>
                  <h3>{mission?.title ?? 'Seu próximo capítulo'}</h3>
                  <p>{mission?.description ?? 'Visite a Guilda para aceitar novos contratos.'}</p>
                  <div className="section-line">
                    <span className="gold">
                      {mission
                        ? `${Math.min(mission.target, questProgress(g, mission))} / ${mission.target} · ${mission.gold} ouro`
                        : 'A guilda aguarda'}
                    </span>
                    <button className="text-button" onClick={() => setScreen('city')}>
                      Ver contratos <ArrowUpRight size={13} />
                    </button>
                  </div>
                </section>
                <section className="panel chronicle-card">
                  <span className="eyebrow">
                    <span className="live-dot" /> ECOS DO MUNDO
                  </span>
                  <p>{g.world.log[0]?.text}</p>
                  <div className="section-line">
                    <small>Dia {g.world.log[0]?.day ?? 1}</small>
                    <button className="text-button" onClick={() => setScreen('journal')}>
                      Abrir diário <ArrowUpRight size={13} />
                    </button>
                  </div>
                </section>
              </div>
              {g.tutorial < 1 && (
                <div className="tutorial-callout">
                  <Compass size={22} />
                  <p>
                    <strong>Seu primeiro passo:</strong> explore as marcas, derrote 5 inimigos e
                    retorne à Guilda para receber sua recompensa.
                  </p>
                  <button
                    onClick={() =>
                      updateGame((d) => {
                        d.tutorial = 1;
                      })
                    }
                    aria-label="Dispensar dica"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}
            </>
          ) : screen === 'zone' ? (
            <ActionScreen dungeon={dungeon} onExit={() => setScreen('world')} />
          ) : screen === 'character' ? (
            <CharacterScreen game={g} />
          ) : screen === 'grimoire' ? (
            <GrimoireScreen game={g} />
          ) : screen === 'inventory' ? (
            <InventoryScreen game={g} />
          ) : screen === 'city' ? (
            <CityScreen game={g} />
          ) : screen === 'company' ? (
            <CompanyScreen game={g} />
          ) : screen === 'army' ? (
            <ArmyScreen game={g} />
          ) : screen === 'kingdom' ? (
            <KingdomScreen game={g} />
          ) : screen === 'settings' ? (
            <SettingsScreen game={g} onMenu={() => setMode('menu')} />
          ) : (
            <>
              <div className="page-heading">
                <span className="eyebrow">HISTÓRIAS ALÉM DA SUA</span>
                <h1>Diário do mundo</h1>
                <p>Enquanto você escreve sua história, o mundo escreve a dele.</p>
              </div>
              <div className="tab-bar">
                {[
                  ['all', 'Tudo'],
                  ['world', 'Mundo'],
                  ['progress', 'Jornada'],
                  ['combat', 'Combate'],
                  ['economy', 'Economia'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    className={logFilter === id ? 'active' : ''}
                    onClick={() => setLogFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="journal">
                {g.world.log
                  .filter((e) => logFilter === 'all' || e.kind === logFilter)
                  .map((e, i) => (
                    <article className="panel journal-entry" key={`${e.id}-${i}`}>
                      <span className="journal-day">
                        DIA <b>{e.day}</b>
                      </span>
                      <div>
                        <span className="eyebrow">
                          {
                            {
                              world: 'MUNDO',
                              progress: 'JORNADA',
                              combat: 'COMBATE',
                              economy: 'ECONOMIA',
                            }[e.kind]
                          }
                        </span>
                        <p>{e.text}</p>
                      </div>
                    </article>
                  ))}
              </div>
            </>
          )}
        </main>
        <footer className="app-footer">
          <span>
            ETERNAL REALMS <i /> PRÉVIA 0.1
          </span>
          <span>
            <span className="save-dot" /> PROGRESSO SALVO LOCALMENTE
          </span>
        </footer>
      </div>
    </div>
  );
}
function ShieldIcon() {
  return <span style={{ fontSize: 14 }}>◇</span>;
}
