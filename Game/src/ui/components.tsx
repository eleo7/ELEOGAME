import { useEffect, useRef } from 'react';
import { Shield, X } from 'lucide-react';
import type { Character } from '../state/types';
import { drawHero } from '../engine/sprites';
import { rank } from '../systems/stats';
export function Sprite({ character, size = 80 }: { character: Character; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!,
      ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 64, 64);
    drawHero(ctx, 32, 51, character, 0, 1.5);
  }, [character]);
  return (
    <canvas
      ref={ref}
      width={64}
      height={64}
      className="sprite"
      style={{ width: size, height: size }}
    />
  );
}
export function Rank({ character }: { character: Character }) {
  return (
    <span className="rank-badge">
      <Shield size={15} />
      {rank(character)}
    </span>
  );
}
export function Meter({
  value,
  max,
  color = '#83b996',
  label,
}: {
  value: number;
  max: number;
  color?: string;
  label?: string;
}) {
  return (
    <div className="meter-wrap">
      {label && (
        <div className="meter-label">
          <span>{label}</span>
          <span>
            {Math.ceil(value)} <small>/ {max}</small>
          </span>
        </div>
      )}
      <div className="meter">
        <i
          style={{
            width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="modal-shade" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <div>
            <span className="eyebrow">ETERNAL REALMS</span>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
export function Empty({
  symbol = '◇',
  title,
  children,
}: {
  symbol?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="empty">
      <span>{symbol}</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
