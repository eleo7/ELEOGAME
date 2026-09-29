import { useState } from 'react';
import { ScrollText, Coins, UserPlus, Check, Heart, ShoppingBag, Users, Flag } from 'lucide-react';
import { B } from '../data/balance';
import { QUESTS } from '../data/content';
import { regionById } from '../data/regions';
import { raceById } from '../data/races';
import { classById, CLASSES } from '../data/classes';
import { buyItem, claimQuest, hire, questProgress } from '../systems/actions';
import { recruits } from '../systems/recruit';
import { power, rankIndex, stats } from '../systems/stats';
import { updateGame } from '../state/store';
import type { SaveGame } from '../state/types';
import { Empty, Meter, Rank, Sprite } from './components';
export function CityScreen({ game: g }: { game: SaveGame }) {
  const [tab, setTab] = useState('Guilda'),
    [filter, setFilter] = useState('');
  const city = regionById(g.world.region);
  return (
    <>
      <div className="city-banner">
        <span className="eyebrow">{city.name} / REFÚGIO SEGURO</span>
        <h1>{city.capital}</h1>
        <p>Descanse. Encontre aliados. Prepare a próxima expedição.</p>
        <div className="city-skyline">♜　♜　♜</div>
      </div>
      <div className="tab-bar">
        {['Guilda', 'Taverna', 'Ferraria', 'Templo', 'Mercado'].map((t) => (
          <button className={tab === t ? 'active' : ''} onClick={() => setTab(t)} key={t}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Guilda' ? (
        <div className="quest-grid">
          {QUESTS.map((q) => {
            const complete = g.quests.completed.includes(q.id),
              active = g.quests.active.includes(q.id),
              progress = questProgress(g, q),
              ready = progress >= q.target;
            return (
              <article className={`panel quest-card ${complete ? 'completed' : ''}`} key={q.id}>
                <div className="section-line">
                  <ScrollText size={21} />
                  <span className="tag">
                    {complete
                      ? 'Concluído'
                      : q.id === 'q10'
                        ? 'História principal'
                        : active
                          ? 'Em andamento'
                          : 'Contrato da guilda'}
                  </span>
                </div>
                <h3>{q.title}</h3>
                <p>{q.description}</p>
                <Meter value={Math.min(q.target, progress)} max={q.target} />
                <div className="quest-reward">
                  <span>
                    <Coins size={13} />
                    {q.gold}
                  </span>
                  <span>✧ {q.xp} XP</span>
                  <small>
                    {Math.min(q.target, progress)}/{q.target}
                  </small>
                </div>
                <button
                  className={ready && active ? 'primary full' : 'full'}
                  disabled={complete || (active && !ready)}
                  onClick={() =>
                    updateGame((d) => {
                      if (active) claimQuest(d, q.id);
                      else if (!d.quests.active.includes(q.id)) d.quests.active.push(q.id);
                    })
                  }
                >
                  {complete ? (
                    <>
                      <Check size={14} /> Concluído
                    </>
                  ) : active ? (
                    ready ? (
                      'Receber recompensa'
                    ) : (
                      'Contrato em andamento'
                    )
                  ) : (
                    'Aceitar contrato'
                  )}
                </button>
              </article>
            );
          })}
        </div>
      ) : tab === 'Taverna' ? (
        <>
          <div className="section-line">
            <div>
              <h2>Encontros ao acaso</h2>
              <p className="muted">
                Novos viajantes a cada 7 dias · salários cobrados diariamente.
              </p>
            </div>
            <select
              aria-label="Filtrar classe"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">Todas as classes</option>
              {CLASSES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="recruit-grid">
            {recruits(g)
              .filter((c) => !filter || c.classId === filter)
              .map((c) => (
                <article className="panel recruit-card" key={c.id}>
                  <div className="section-line">
                    <Sprite character={c} />
                    <Rank character={c} />
                  </div>
                  <h3>{c.name}</h3>
                  <p>
                    {raceById(c.race).name} · {classById(c.classId).name}
                  </p>
                  <div className="tags">
                    <span className="tag">{c.personality}</span>
                    <span className="tag">{c.trait}</span>
                  </div>
                  <div className="recruit-facts">
                    <span>
                      Forma <b>{c.form}</b>
                    </span>
                    <span>
                      Afinidade <b>{c.grimoire.element}</b>
                    </span>
                    <span>
                      Potencial <b>{g.player.awakened ? B.ranks[c.potential] : 'Oculto'}</b>
                    </span>
                    <span>
                      Salário <b>{c.salary} ouro / dia</b>
                    </span>
                  </div>
                  <button
                    className="full"
                    disabled={
                      g.gold < c.cost ||
                      g.party.length >= (rankIndex(power(g.player)) >= 2 ? 12 : 3)
                    }
                    onClick={() => updateGame((d) => hire(d, c.id))}
                  >
                    <UserPlus size={15} /> Contratar <span className="gold">{c.cost} ouro</span>
                  </button>
                </article>
              ))}
          </div>
        </>
      ) : tab === 'Templo' ? (
        <section className="panel service-panel">
          <Heart size={48} strokeWidth={1} />
          <h2>Santuário da Aurora</h2>
          <p>Restaure completamente vida, mana e stamina para sua próxima jornada.</p>
          <button
            className="primary"
            disabled={g.gold < B.healCost}
            onClick={() =>
              updateGame((d) => {
                if (d.gold >= B.healCost) {
                  d.gold -= B.healCost;
                  const s = stats(d.player);
                  d.player.hp = s.hp;
                  d.player.mana = s.mana;
                  d.player.stamina = s.stamina;
                }
              })
            }
          >
            Receber bênção · {B.healCost} ouro
          </button>
          <small>
            Vida atual: {Math.ceil(g.player.hp)} / {stats(g.player).hp}
          </small>
        </section>
      ) : tab === 'Ferraria' ? (
        <div className="shop-grid">
          {['Arma', 'Armadura', 'Elmo', 'Botas'].map((slot) => (
            <section className="panel service-panel" key={slot}>
              <ShoppingBag size={35} />
              <h3>{slot} da Guilda</h3>
              <p>Forjado para seu nível. Raridade revelada na compra.</p>
              <button
                disabled={
                  g.gold < Math.floor(B.shopCost * (1 - Math.min(0.3, g.player.attrs.CAR * 0.005)))
                }
                onClick={() => updateGame((d) => buyItem(d, slot))}
              >
                Comprar · {Math.floor(B.shopCost * (1 - Math.min(0.3, g.player.attrs.CAR * 0.005)))}{' '}
                ouro
              </button>
            </section>
          ))}
        </div>
      ) : (
        <section className="panel service-panel">
          <ShoppingBag size={45} />
          <h2>Provisões de viagem</h2>
          <p>Seus companheiros consomem comida a cada dia. Mantenha os estoques abastecidos.</p>
          <p>
            Estoque: <strong>{g.resources.Comida} alimentos</strong>
          </p>
          <button
            className="primary"
            disabled={g.gold < 20}
            onClick={() =>
              updateGame((d) => {
                if (d.gold >= 20) {
                  d.gold -= 20;
                  d.resources.Comida += 20;
                }
              })
            }
          >
            Comprar 20 alimentos · 20 ouro
          </button>
        </section>
      )}
    </>
  );
}
export function CompanyScreen({ game: g }: { game: SaveGame }) {
  const cap = rankIndex(power(g.player)) >= 2 ? 12 : 3;
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">LAÇOS QUE SE TORNAM LEGADO</span>
        <h1>Sua companhia</h1>
        <p>Até três aliados acompanham você na ação. Mantenha a lealdade e pague seus salários.</p>
      </div>
      <div className="panel company-settings">
        <Flag size={28} />
        <label className="field-label">
          Nome da companhia
          <input
            maxLength={40}
            value={g.companyName}
            onChange={(e) => {
              const value = e.target.value;
              updateGame((d) => {
                d.companyName = value;
              });
            }}
          />
        </label>
        <label className="field-label">
          Ordem de combate
          <select
            value={g.companyOrder}
            onChange={(e) => {
              const v = e.target.value as SaveGame['companyOrder'];
              updateGame((d) => {
                d.companyOrder = v;
              });
            }}
          >
            <option>agressivo</option>
            <option>defensivo</option>
            <option>suporte</option>
          </select>
        </label>
        <span className="tag">
          <Users size={13} />
          {g.party.length} / {cap} aliados
        </span>
      </div>
      {!g.party.length ? (
        <Empty title="Toda companhia começa com um encontro">
          Visite a Taverna da cidade e contrate seus primeiros companheiros.
        </Empty>
      ) : (
        <div className="recruit-grid mt">
          {g.party.map((c) => (
            <article className="panel" key={c.id}>
              <div className="section-line">
                <Sprite character={c} />
                <Rank character={c} />
              </div>
              <h3>{c.name}</h3>
              <p className="muted">
                {raceById(c.race).name} · {classById(c.classId).name}
              </p>
              <Meter
                label="Lealdade"
                value={c.loyalty}
                max={100}
                color={c.loyalty < 30 ? '#c47b75' : '#90b18c'}
              />
              <p className="muted">
                {c.personality} · {c.salary} ouro/dia
              </p>
              <div className="button-row">
                <button
                  disabled={!g.activeParty.includes(c.id) && g.activeParty.length >= 3}
                  onClick={() =>
                    updateGame((d) => {
                      d.activeParty = d.activeParty.includes(c.id)
                        ? d.activeParty.filter((id) => id !== c.id)
                        : d.activeParty.length < 3
                          ? [...d.activeParty, c.id]
                          : d.activeParty;
                    })
                  }
                >
                  {g.activeParty.includes(c.id) ? 'Retirar do grupo' : 'Incluir no grupo'}
                </button>
                <button
                  disabled={g.gold < 15 || c.loyalty >= 100}
                  onClick={() =>
                    updateGame((d) => {
                      const ally = d.party.find((a) => a.id === c.id);
                      if (ally && d.gold >= 15) {
                        d.gold -= 15;
                        ally.loyalty = Math.min(100, ally.loyalty + 10);
                      }
                    })
                  }
                >
                  Presente · 15
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="notice mt">
        Rank C expande sua companhia para 12 aliados. Somente os três membros ativos entram na zona.
      </div>
    </>
  );
}
