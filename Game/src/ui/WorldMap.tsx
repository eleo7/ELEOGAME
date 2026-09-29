import { useEffect, useRef } from 'react';
import { Crown, Anchor, Mountain, Trees, MapPin, Compass } from 'lucide-react';
import { REGIONS } from '../data/regions';
import { mulberry32 } from '../systems/rng';
import type { Region } from '../state/types';
const land = [
  [155, 127],
  [242, 83],
  [289, 113],
  [335, 63],
  [400, 95],
  [480, 66],
  [531, 133],
  [606, 99],
  [677, 150],
  [743, 129],
  [792, 208],
  [769, 250],
  [822, 299],
  [778, 353],
  [816, 425],
  [754, 455],
  [734, 525],
  [654, 514],
  [611, 574],
  [558, 542],
  [495, 562],
  [451, 513],
  [395, 541],
  [352, 483],
  [284, 501],
  [263, 445],
  [207, 425],
  [230, 365],
  [183, 325],
  [208, 268],
  [164, 232],
  [184, 185],
];
export function WorldMap({
  selected,
  current,
  onSelect,
  decorative = false,
}: {
  selected: string;
  current?: string;
  onSelect?: (r: Region) => void;
  decorative?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current!.getContext('2d')!,
      rng = mulberry32(7834);
    const w = 1000,
      h = 680;
    ctx.fillStyle = '#15252b';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 24)
      for (let x = 0; x < w; x += 24) {
        ctx.fillStyle = '#74909112';
        ctx.fillRect(x, y, 1, 1);
      }
    const p = new Path2D();
    land.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
    p.closePath();
    ctx.save();
    ctx.translate(-16, -7);
    ctx.strokeStyle = '#78968815';
    ctx.lineWidth = 28;
    ctx.stroke(p);
    ctx.restore();
    ctx.fillStyle = '#344438';
    ctx.fill(p);
    ctx.strokeStyle = '#8c9d7660';
    ctx.lineWidth = 2;
    ctx.stroke(p);
    ctx.save();
    ctx.clip(p);
    const gradient = ctx.createLinearGradient(0, 90, 0, 600);
    gradient.addColorStop(0, '#91a39860');
    gradient.addColorStop(0.3, '#5b775523');
    gradient.addColorStop(0.7, '#74865a20');
    gradient.addColorStop(1, '#44304499');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 18000; i++) {
      const x = rng() * w,
        y = rng() * h;
      ctx.fillStyle = rng() > 0.5 ? '#bfd09d0c' : '#101e2220';
      ctx.fillRect(x, y, 1 + rng() * 3, 1 + rng() * 3);
    }
    for (let i = 0; i < 26; i++) {
      ctx.strokeStyle = '#a0b8860c';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(470, 345, 100 + i * 15, 65 + i * 9, 0.3, 0, Math.PI * 2);
      ctx.stroke();
    }
    const river = (points: number[][]) => {
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
      ctx.strokeStyle = '#1b343c';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.strokeStyle = '#779e9b55';
      ctx.lineWidth = 1;
      ctx.stroke();
    };
    river([
      [440, 134],
      [456, 173],
      [432, 213],
      [454, 240],
      [443, 278],
      [466, 304],
      [449, 338],
      [474, 365],
      [466, 412],
      [504, 444],
      [512, 481],
      [558, 542],
    ]);
    river([
      [648, 234],
      [614, 249],
      [602, 273],
      [552, 287],
      [514, 316],
      [449, 338],
    ]);
    for (let i = 0; i < 200; i++) {
      const x = 240 + rng() * 480,
        y = 140 + rng() * 310;
      if ((x > 480 && y < 300) || (x < 390 && y > 280)) {
        ctx.fillStyle = '#1a3227aa';
        ctx.beginPath();
        ctx.moveTo(x, y - 7);
        ctx.lineTo(x - 4, y + 3);
        ctx.lineTo(x + 4, y + 3);
        ctx.fill();
        ctx.fillStyle = '#94ab6a44';
        ctx.fillRect(x - 2, y - 2, 1, 3);
      }
    }
    for (let i = 0; i < 48; i++) {
      const x = 280 + rng() * 390,
        y = 105 + rng() * 120;
      const size = 7 + rng() * 15;
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x - size * 0.6, y + 5);
      ctx.lineTo(x + size * 0.8, y + 5);
      ctx.fillStyle = '#748276';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x, y + 5);
      ctx.lineTo(x + size * 0.8, y + 5);
      ctx.fillStyle = '#293b37';
      ctx.fill();
      ctx.fillStyle = '#c3c8af99';
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x - 3, y - size + 6);
      ctx.lineTo(x + 4, y - size + 6);
      ctx.fill();
    }
    ctx.setLineDash([3, 6]);
    ctx.strokeStyle = '#dccd9560';
    ctx.lineWidth = 1;
    for (const r of REGIONS.slice(0, 8)) {
      ctx.beginPath();
      ctx.moveTo(480, 394);
      ctx.lineTo(r.x * 10, r.y * 6.8);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
    for (const [x, y] of [
      [140, 120],
      [114, 145],
      [107, 94],
      [850, 529],
      [872, 500],
    ]) {
      ctx.fillStyle = '#3f4e41';
      ctx.beginPath();
      ctx.ellipse(x, y, 18, 9, -0.5, 0, 7);
      ctx.fill();
      ctx.strokeStyle = '#83987750';
      ctx.stroke();
    }
    ctx.font = 'italic 17px Georgia';
    ctx.fillStyle = '#9bad9c46';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(150, 410);
    ctx.rotate(-0.2);
    ctx.fillText('Mar dos Esquecidos', 0, 0);
    ctx.restore();
    ctx.fillText('Oceano das Brumas', 570, 630);
  }, []);
  return (
    <div className={`world-map ${decorative ? 'decorative' : ''}`}>
      <canvas ref={ref} width={1000} height={680} />
      <div className="map-grid" />
      {!decorative &&
        REGIONS.map((r) => {
          const Icon = r.kingdom
            ? Crown
            : r.biome === 'Floresta'
              ? Trees
              : r.biome === 'Água'
                ? Anchor
                : Mountain;
          return (
            <button
              key={r.id}
              onClick={() => onSelect?.(r)}
              className={`map-node ${selected === r.id ? 'selected' : ''} ${current === r.id ? 'current' : ''}`}
              style={{ left: `${r.x}%`, top: `${r.y}%` }}
              aria-label={`Selecionar ${r.name}`}
            >
              <span className="node-dot" style={{ color: r.color }}>
                <Icon size={r.kingdom ? 17 : 14} />
              </span>
              <span className="map-label">{r.name}</span>
              {current === r.id && <span className="here-label">VOCÊ ESTÁ AQUI</span>}
            </button>
          );
        })}
      <div className="compass">
        <Compass size={48} strokeWidth={0.7} />
        <span>N</span>
      </div>
      <div className="map-scale">
        <i /> 200 léguas
      </div>
      {!decorative && (
        <div className="map-legend">
          <span>
            <Crown size={12} /> Reino
          </span>
          <span>
            <Mountain size={12} /> Região neutra
          </span>
          <span>
            <MapPin size={12} /> Sua localização
          </span>
        </div>
      )}
    </div>
  );
}
