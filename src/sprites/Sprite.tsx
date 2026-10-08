import { memo, useMemo } from 'react';
import { SPRITES } from './sprites';

interface Props {
  id: string;
  scale?: number;
  frame?: number;
  palette?: Record<string, string>;
  className?: string;
}

const cache = new Map<string, { x: number; y: number; w: number; c: string }[]>();

function runs(id: string, frame: number, override?: Record<string, string>) {
  const key = `${id}:${frame}:${override ? JSON.stringify(override) : ''}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const def = SPRITES[id];
  const pal = { ...def.palette, ...override };
  const rows = def.frames[frame % def.frames.length];
  const out: { x: number; y: number; w: number; c: string }[] = [];
  rows.forEach((raw, y) => {
    const row = raw.padEnd(16, '.').slice(0, 16);
    let x = 0;
    while (x < 16) {
      const ch = row[x];
      let w = 1;
      while (x + w < 16 && row[x + w] === ch) w++;
      const c = pal[ch];
      if (ch !== '.' && c) out.push({ x, y, w, c });
      x += w;
    }
  });
  cache.set(key, out);
  return out;
}

export const Sprite = memo(function Sprite({ id, scale = 4, frame = 0, palette, className }: Props) {
  const rects = useMemo(() => (SPRITES[id] ? runs(id, frame, palette) : []), [id, frame, palette]);
  const size = 16 * scale;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden>
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
      ))}
    </svg>
  );
});

export function spriteFrame(id: string, time: number, active: boolean) {
  const def = SPRITES[id];
  if (!def || !active) return 0;
  return Math.floor(time * def.fps) % def.frames.length;
}
