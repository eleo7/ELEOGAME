import { useState } from 'react';
import { ArrowRight, Dices, Minus, Plus, Check } from 'lucide-react';
import { RACES } from '../data/races';
import { CLASSES } from '../data/classes';
import { ATTRIBUTES, B, ELEMENTS, ELEMENT_COLORS } from '../data/balance';
import { createCharacter, defaultAttributes } from '../systems/character';
import { pointCost } from '../systems/stats';
import { newGame } from '../state/store';
import { Meter, Sprite } from './components';
export function CreateCharacter({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [step, setStep] = useState(0),
    [race, setRace] = useState('race-0'),
    [classId, setClass] = useState('warrior'),
    [attrs, setAttrs] = useState(defaultAttributes),
    [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9)),
    [name, setName] = useState('Aerin'),
    [hub, setHub] = useState(false);
  const c = createCharacter(name, race, classId, attrs, seed),
    r = RACES.find((r) => r.id === race)!,
    cls = CLASSES.find((k) => k.id === classId)!,
    spent = pointCost(attrs);
  return (
    <main className="creation">
      <div className="creation-top">
        <button className="text-button" onClick={onBack}>
          ← Voltar
        </button>
        <span className="eyebrow">UMA HISTÓRIA AINDA NÃO ESCRITA</span>
      </div>
      <div className="creation-heading">
        <h1>Forje seu destino.</h1>
        <p>Cada linhagem carrega uma história. A próxima será a sua.</p>
      </div>
      <div className="stepper">
        {['Linhagem', 'Vocação', 'Atributos', 'Identidade'].map((s, i) => (
          <button className={i === step ? 'active' : ''} key={s} onClick={() => setStep(i)}>
            <span>{i < step ? <Check size={13} /> : i + 1}</span>
            {s}
          </button>
        ))}
      </div>
      <div className="creation-grid">
        <section className="panel creation-content">
          {step === 0 ? (
            <>
              <span className="eyebrow">01 / ESCOLHA SUA LINHAGEM</span>
              <div className="race-grid">
                {RACES.slice(0, 24).map((r) => (
                  <button
                    key={r.id}
                    className={`choice ${race === r.id ? 'chosen' : ''}`}
                    onClick={() => setRace(r.id)}
                  >
                    <span style={{ color: r.color }}>◆</span>
                    <strong>{r.name}</strong>
                    <small>{r.kingdom}</small>
                  </button>
                ))}
              </div>
            </>
          ) : step === 1 ? (
            <>
              <span className="eyebrow">02 / ESCOLHA SUA VOCAÇÃO</span>
              <div className="class-grid">
                {CLASSES.map((k) => (
                  <button
                    key={k.id}
                    className={`choice ${classId === k.id ? 'chosen' : ''}`}
                    onClick={() => setClass(k.id)}
                  >
                    <span style={{ color: k.color }}>✧</span>
                    <strong>{k.name}</strong>
                    <small>
                      {k.weapon} · {k.primary}
                    </small>
                    <p>{k.skills.slice(0, 2).join(' · ')}</p>
                  </button>
                ))}
              </div>
            </>
          ) : step === 2 ? (
            <>
              <div className="section-line">
                <span className="eyebrow">03 / COMPRA DE ATRIBUTOS</span>
                <span className="gold">{B.pointBudget - spent} pontos disponíveis</span>
              </div>
              <p>
                A partir de 13, cada aumento custa 2 pontos. Bônus raciais são aplicados depois.
              </p>
              {ATTRIBUTES.map((a) => (
                <div className="attribute-buy" key={a}>
                  <strong>{a}</strong>
                  <span>Bônus racial {r.mods[a] ?? 0}</span>
                  <button
                    aria-label={`Diminuir ${a}`}
                    disabled={attrs[a] <= 8}
                    onClick={() => setAttrs({ ...attrs, [a]: attrs[a] - 1 })}
                  >
                    <Minus size={13} />
                  </button>
                  <b>{attrs[a]}</b>
                  <button
                    aria-label={`Aumentar ${a}`}
                    disabled={attrs[a] >= 15 || pointCost({ ...attrs, [a]: attrs[a] + 1 }) > 27}
                    onClick={() => setAttrs({ ...attrs, [a]: attrs[a] + 1 })}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              ))}
            </>
          ) : (
            <>
              <span className="eyebrow">04 / QUEM VOCÊ SERÁ?</span>
              <label className="field-label">
                Nome do personagem
                <input
                  maxLength={24}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                />
              </label>
              <label className="check-label">
                <input type="checkbox" checked={hub} onChange={(e) => setHub(e.target.checked)} />{' '}
                Começar em Arkanis, a Cidade-Livre
              </label>
              <div className="section-line">
                <h3>Afinidades naturais</h3>
                <button
                  className="text-button"
                  onClick={() => setSeed(Math.floor(Math.random() * 1e9))}
                >
                  <Dices size={15} /> Rolar destino
                </button>
              </div>
              {ELEMENTS.map((e, i) => (
                <Meter
                  key={e}
                  label={e}
                  value={c.affinities[e]}
                  max={100}
                  color={ELEMENT_COLORS[i]}
                />
              ))}
              <p className="notice">
                Forma única: <strong>{c.form}</strong>. Afinidade principal: {c.grimoire.element}.
              </p>
            </>
          )}
          <div className="creation-bottom">
            <span>Etapa {step + 1} de 4</span>
            <button
              className="primary"
              disabled={!name.trim()}
              onClick={() => {
                if (step < 3) setStep(step + 1);
                else {
                  newGame(name, race, classId, attrs, seed, hub);
                  onDone();
                }
              }}
            >
              {step === 3 ? 'Iniciar jornada' : 'Continuar'}
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
        <aside className="panel hero-preview">
          <span className="eyebrow">SEU PERSONAGEM</span>
          <div className="portrait-stage">
            <div className="portrait-ring" />
            <Sprite character={c} size={170} />
          </div>
          <h2>{name || 'Aventureiro'}</h2>
          <p>
            {r.name} · {cls.name}
          </p>
          <span className="rank-large">E</span>
          <span className="eyebrow">RANK INICIAL</span>
          <div className="preview-facts">
            <div>
              <span>Origem</span>
              <strong>{hub ? 'Arkanis' : r.kingdom}</strong>
            </div>
            <div>
              <span>Linhagem</span>
              <strong>{r.first}</strong>
            </div>
            <div>
              <span>Passiva</span>
              <strong>{r.passive}</strong>
            </div>
          </div>
          <p className="flavor">
            “Não é o sangue que determina um soberano, mas as escolhas que ele faz.”
          </p>
        </aside>
      </div>
    </main>
  );
}
