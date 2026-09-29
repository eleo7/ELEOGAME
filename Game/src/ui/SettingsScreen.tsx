import { useRef, useState } from 'react';
import { Download, Upload, Save, Volume2 } from 'lucide-react';
import { exportSave, parseSave, save } from '../systems/save';
import { replaceGame, updateGame } from '../state/store';
import type { SaveGame } from '../state/types';
export function SettingsScreen({ game: g, onMenu }: { game: SaveGame; onMenu: () => void }) {
  const input = useRef<HTMLInputElement>(null),
    [message, setMessage] = useState('');
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">AJUSTE SUA JORNADA</span>
        <h1>Configurações</h1>
        <p>
          O progresso é salvo automaticamente. Exporte um arquivo para manter uma cópia fora do
          navegador.
        </p>
      </div>
      <div className="settings-grid">
        <section className="panel">
          <h2>Experiência de jogo</h2>
          <label className="field-label">
            <span>
              <Volume2 size={15} /> Volume dos efeitos · {Math.round(g.settings.volume * 100)}%
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={g.settings.volume}
              onChange={(e) => {
                const v = Number(e.target.value);
                updateGame((d) => {
                  d.settings.volume = v;
                });
              }}
            />
          </label>
          <label className="field-label">
            Dificuldade
            <select
              value={g.settings.difficulty}
              onChange={(e) => {
                const v = Number(e.target.value);
                updateGame((d) => {
                  d.settings.difficulty = v;
                });
              }}
            >
              <option value={0.65}>Narrativa · dano recebido reduzido</option>
              <option value={1}>Aventureiro · padrão</option>
              <option value={1.5}>Veterano · dano recebido aumentado</option>
            </select>
          </label>
          <label className="field-label">
            Passagem do tempo
            <select
              value={g.settings.timeScale}
              onChange={(e) => {
                const v = Number(e.target.value);
                updateGame((d) => {
                  d.settings.timeScale = v;
                });
              }}
            >
              <option value={0.5}>Lenta · 180 segundos por dia</option>
              <option value={1}>Padrão · 90 segundos por dia</option>
              <option value={2}>Rápida · 45 segundos por dia</option>
            </select>
          </label>
          <p className="muted">O mundo pausa nas telas de gestão. Viajar avança um dia.</p>
        </section>
        <section className="panel">
          <h2>Seu progresso</h2>
          <p>
            {g.player.name} · nível {g.player.level} · dia {g.world.day}
          </p>
          <div className="save-buttons">
            <button onClick={() => setMessage(save(g) ?? 'Progresso salvo neste navegador.')}>
              <Save size={17} /> Salvar agora
            </button>
            <button onClick={() => exportSave(g)}>
              <Download size={17} /> Exportar JSON
            </button>
            <button onClick={() => input.current?.click()}>
              <Upload size={17} /> Importar JSON
            </button>
            <button onClick={onMenu}>Voltar ao menu</button>
          </div>
          <input
            type="file"
            ref={input}
            accept=".json,application/json"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                if (file.size > 4_000_000) throw new Error('Save excede o limite de 4 MB');
                const next = parseSave(await file.text());
                replaceGame(next);
                setMessage('Save importado com sucesso.');
              } catch (err) {
                setMessage(err instanceof Error ? err.message : 'Arquivo inválido');
              }
              e.target.value = '';
            }}
          />
          <p className="notice" role="status">
            {message || 'Save v1 · Sem conta e sem conexão obrigatória depois do carregamento.'}
          </p>
        </section>
      </div>
      <section className="panel mt">
        <h3>Controles</h3>
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
            <kbd>1 – 4</kbd> Habilidades
          </span>
          <span>
            <kbd>E</kbd> Interagir
          </span>
          <span>
            <kbd>P / TAB</kbd> Pausar
          </span>
        </div>
      </section>
    </>
  );
}
