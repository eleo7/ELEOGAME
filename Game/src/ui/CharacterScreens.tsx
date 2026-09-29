import { useState } from 'react';
import { BookOpen, Lock, Sparkles, ArrowUpRight, Check, Package, Coins } from 'lucide-react';
import { B, ATTRIBUTES, ELEMENTS, ELEMENT_COLORS, SLOTS } from '../data/balance';
import { ADVANCED, SPELL_NAMES } from '../data/content';
import { raceById } from '../data/races';
import { classById, CLASSES } from '../data/classes';
import { stats, power, rank, xpNeeded } from '../systems/stats';
import { evolve, evolutionRequirement } from '../systems/evolution';
import { equip } from '../systems/actions';
import { updateGame } from '../state/store';
import type { SaveGame, Branch, Element } from '../state/types';
import { Empty, Meter, Sprite, Rank } from './components';
export function CharacterScreen({ game: g }: { game: SaveGame }) {
  const c = g.player,
    r = raceById(c.race),
    cl = classById(c.classId),
    s = stats(c),
    [branch, setBranch] = useState<Branch>('Marcial');
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">AQUELE QUE ESCOLHE ASCENDER</span>
        <h1>Seu legado</h1>
        <p>A força de um soberano começa muito antes de sua coroa.</p>
      </div>
      <div className="character-layout">
        <section className="panel character-card">
          <div className="character-identity">
            <Sprite character={c} size={100} />
            <div>
              <span className="eyebrow">
                {r.name} · {cl.name}
              </span>
              <h2>{c.name}</h2>
              <p>
                Nível {c.level} ·{' '}
                {c.tier === 0
                  ? 'Linhagem original'
                  : c.tier === 1
                    ? r.first
                    : `${c.branch} · T${c.tier}`}
              </p>
            </div>
            <Rank character={c} />
          </div>
          <Meter label="Experiência" value={c.xp} max={xpNeeded(c.level)} color="#c7ad77" />
          <div className="power-card">
            <span>PODER TOTAL</span>
            <b>
              {power(c)} <small>PW</small>
            </b>
            <span>Rank {rank(c)}</span>
          </div>
          <div className="section-line">
            <h3>Atributos</h3>
            <span className="tag">{c.points} pontos livres</span>
          </div>
          <div className="stats-grid">
            {ATTRIBUTES.map((a) => (
              <div key={a}>
                <span>{a}</span>
                <strong>{c.attrs[a]}</strong>
                <button
                  className="tiny"
                  disabled={!c.points}
                  onClick={() =>
                    updateGame((d) => {
                      if (d.player.points > 0) {
                        d.player.points--;
                        d.player.attrs[a]++;
                      }
                    })
                  }
                  aria-label={`Melhorar ${a}`}
                >
                  +
                </button>
              </div>
            ))}
          </div>
          <div className="derived">
            {[
              ['Vida máxima', s.hp],
              ['Mana máxima', s.mana],
              ['Ataque físico', s.attack.toFixed(0)],
              ['Poder mágico', s.magic.toFixed(0)],
              ['Defesa', s.defense.toFixed(0)],
              ['Crítico', `${(s.crit * 100).toFixed(1)}%`],
            ].map(([k, v]) => (
              <div key={k}>
                <span>{k}</span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
          <div className="notice">
            <Sparkles size={16} />
            <div>
              <strong>{c.form}</strong>
              <p>
                Forma única ·{' '}
                {c.awakened ? 'Primeiro Despertar realizado' : 'Potencial ainda oculto'}
              </p>
            </div>
          </div>
        </section>
        <div>
          <section className="panel">
            <span className="eyebrow">A ÁRVORE DA SUA LINHAGEM</span>
            <h2>Evolução racial</h2>
            <div className="evolution-track">
              {B.tierLevels.map((level, i) => (
                <div className={i <= c.tier ? 'unlocked' : ''} key={i}>
                  <span>
                    {i < c.tier ? (
                      <Check size={18} />
                    ) : i > c.tier ? (
                      <Lock size={15} />
                    ) : (
                      <Sparkles size={18} />
                    )}
                  </span>
                  <b>T{i}</b>
                  <small>{i === 0 ? 'Origem' : `Nível ${level}`}</small>
                </div>
              ))}
            </div>
            <div className="branch-grid">
              {(['Marcial', 'Arcano', 'Único'] as Branch[]).map((b, i) => (
                <button
                  className={`choice ${branch === b ? 'chosen' : ''}`}
                  key={b}
                  onClick={() => setBranch(b)}
                  disabled={c.tier >= 2 && c.branch !== b}
                >
                  <strong>{b}</strong>
                  <small>{r.finals[i]}</small>
                </button>
              ))}
            </div>
            <p className="muted">
              Próximo tier: {B.tierCosts[c.tier + 1] ?? '—'} Essências · {c.tier + 1} chefes
              derrotados. O ramo é fixado em T2.
            </p>
            <button
              className="primary full"
              disabled={!!evolutionRequirement(g)}
              onClick={() => updateGame((d) => evolve(d, branch))}
            >
              <Sparkles size={16} />
              {evolutionRequirement(g) ?? 'Ascender linhagem'}
            </button>
          </section>
          <section className="panel mt">
            <span className="eyebrow">NÍVEIS 20 / 40 / 70</span>
            <h2>Especialização de classe</h2>
            {cl.paths.map((path, i) => (
              <button
                key={i}
                disabled={c.level < 20 || c.specialization !== null}
                className={`specialization ${c.specialization === i ? 'chosen' : ''}`}
                onClick={() =>
                  updateGame((d) => {
                    if (d.player.level >= 20 && d.player.specialization === null) {
                      d.player.specialization = i;
                      d.player.attrs[cl.primary] += 3;
                    }
                  })
                }
              >
                <span>
                  {path.map((n, j) => (
                    <span key={n} className={c.level >= [20, 40, 70][j] ? 'gold' : ''}>
                      {n}
                      {j < 2 ? ' → ' : ''}
                    </span>
                  ))}
                </span>
                {c.specialization === i ? (
                  <Check size={16} />
                ) : c.level < 20 ? (
                  <Lock size={14} />
                ) : (
                  <ArrowUpRight size={15} />
                )}
              </button>
            ))}
            <label className="field-label">
              Classe secundária · nível 50
              <select
                disabled={c.level < 50 || c.secondary !== null}
                value={c.secondary ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  updateGame((d) => {
                    if (d.player.level >= 50 && !d.player.secondary && value !== d.player.classId) {
                      d.player.secondary = value;
                      d.player.attrs[classById(value).primary] += 2;
                    }
                  });
                }}
              >
                <option value="">Escolher classe híbrida</option>
                {CLASSES.filter((k) => k.id !== c.classId).map((k) => (
                  <option value={k.id} key={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
            </label>
          </section>
        </div>
      </div>
    </>
  );
}
export function GrimoireScreen({ game: g }: { game: SaveGame }) {
  const c = g.player,
    main = c.grimoire.element;
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">O CONHECIMENTO TEM UM PREÇO</span>
        <h1>Grimório de {main}</h1>
        <p>Uma afinidade. Cinco páginas. Infinitas possibilidades.</p>
      </div>
      <div className="grimoire-layout">
        <section className="panel">
          <div className="book-emblem">
            <BookOpen size={64} strokeWidth={0.8} />
            <Sparkles size={22} />
          </div>
          <h2 className="center">{c.form}</h2>
          <p className="center muted">A assinatura mágica de {c.name}</p>
          <div className="divider" />
          {ELEMENTS.map((e, i) => (
            <Meter key={e} label={e} value={c.affinities[e]} max={100} color={ELEMENT_COLORS[i]} />
          ))}
          <h3>Afinidades avançadas</h3>
          <div className="tags">
            {ADVANCED.map(([name, a, b]) => (
              <span className="tag" key={name} title={`${a} + ${b} ≥ 60`}>
                {c.affinities[a as Element] >= 60 && c.affinities[b as Element] >= 60 ? '✧' : '♧'}{' '}
                {name}
              </span>
            ))}
          </div>
        </section>
        <div className="spell-pages">
          {B.pageLevels.map((level, i) => {
            const unlocked = c.level >= level,
              upgrade = c.grimoire.pages[i];
            return (
              <section key={i} className={`panel spell-page ${!unlocked ? 'locked' : ''}`}>
                <div className="page-number">{['I', 'II', 'III', 'IV', 'V'][i]}</div>
                <div>
                  <span className="eyebrow">
                    PÁGINA {i + 1} · NÍVEL {level}
                  </span>
                  <h3>{SPELL_NAMES[main][i]}</h3>
                  <p>
                    {unlocked
                      ? `Amplifica as habilidades da sua classe · melhoria ${upgrade}/3`
                      : 'O conhecimento aguarda seu amadurecimento.'}
                  </p>
                </div>
                <button
                  disabled={!unlocked || upgrade >= 3 || g.essence < B.pageCost * (upgrade + 1)}
                  onClick={() =>
                    updateGame((d) => {
                      const p = d.player,
                        n = p.grimoire.pages[i],
                        cost = B.pageCost * (n + 1);
                      if (p.level >= level && n < 3 && d.essence >= cost) {
                        d.essence -= cost;
                        p.grimoire.pages[i]++;
                      }
                    })
                  }
                >
                  {!unlocked ? (
                    <Lock size={16} />
                  ) : upgrade >= 3 ? (
                    <Check size={16} />
                  ) : (
                    <>
                      <Sparkles size={14} />
                      {B.pageCost * (upgrade + 1)}
                    </>
                  )}
                </button>
              </section>
            );
          })}
          <div className="forbidden">
            <Lock size={18} />
            <span>
              A sexta página permanece selada. Seu conhecimento ainda não está disponível nesta
              versão.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
export function InventoryScreen({ game: g }: { game: SaveGame }) {
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">RECOMPENSAS DE UMA JORNADA</span>
        <h1>Inventário</h1>
        <p>Seu equipamento altera atributos de combate e o Poder de Rank.</p>
      </div>
      <div className="inventory-layout">
        <section className="panel">
          <h3>Equipamento</h3>
          {SLOTS.map((slot) => {
            const item = g.player.equipment[slot];
            return (
              <div className="equipment-slot" key={slot}>
                <Package size={19} />
                <div>
                  <span className="eyebrow">{slot}</span>
                  <strong style={{ color: item ? B.rarityColors[item.rarity] : undefined }}>
                    {item?.name ?? 'Sem equipamento'}
                  </strong>
                </div>
                {item && <b>+{item.power}</b>}
              </div>
            );
          })}
        </section>
        <section className="panel">
          <div className="section-line">
            <h3>Mochila</h3>
            <span className="tag">{g.inventory.length} / 500</span>
          </div>
          {!g.inventory.length ? (
            <Empty title="Sua história ainda cabe no bolso">
              Derrote inimigos, abra tesouros ou visite a ferraria para encontrar equipamentos.
            </Empty>
          ) : (
            <div className="item-grid">
              {g.inventory.map((item) => (
                <article
                  className="item-card"
                  key={item.id}
                  style={{ borderTopColor: B.rarityColors[item.rarity] }}
                >
                  <div className="section-line">
                    <Package size={23} style={{ color: B.rarityColors[item.rarity] }} />
                    <small>{B.rarityNames[item.rarity]}</small>
                  </div>
                  <h3>{item.name}</h3>
                  <p>
                    Nível {item.level} · +{item.power} PW
                  </p>
                  <div className="button-row">
                    <button onClick={() => updateGame((d) => equip(d, item.id))}>Equipar</button>
                    <button
                      title="Vender item"
                      onClick={() =>
                        updateGame((d) => {
                          const i = d.inventory.find((i) => i.id === item.id);
                          if (i) {
                            d.gold += i.value;
                            d.inventory = d.inventory.filter((i) => i.id !== item.id);
                          }
                        })
                      }
                    >
                      <Coins size={12} />
                      {item.value}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
