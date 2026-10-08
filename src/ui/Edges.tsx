import { useEffect, useRef } from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';
import { game } from '../game/engine';
import { fmt } from '../game/format';
import { useTick } from './hooks';

const SVG = 'http://www.w3.org/2000/svg';

function bugColor(density: number) {
  if (density < 0.004) return '#4ade80';
  if (density < 0.015) return '#facc15';
  return '#f87171';
}

export function PacketEdge(props: EdgeProps) {
  const { id, selected } = props;
  const [path, lx, ly] = getBezierPath(props);
  const pathRef = useRef<SVGPathElement>(null);
  const streamRef = useRef<SVGPathElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const labelRef = useRef<SVGTextElement>(null);

  useEffect(() => {
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const e = game.edge(id);
      const p = pathRef.current;
      const g = gRef.current;
      const stream = streamRef.current;
      const label = labelRef.current;
      if (!e || !p || !g || !stream || !label) return;
      const len = p.getTotalLength();
      const isStream = e.rate > 2.5 || e.packets.length > 5 || e.locRate > 3000;

      let bugs = 0;
      let loc = 0;
      for (const pk of e.packets) {
        bugs += pk.p.bugs;
        loc += pk.p.loc;
      }

      if (isStream) {
        stream.style.display = '';
        const w = Math.min(14, 3 + Math.log10(Math.max(10, e.locRate)) * 1.6);
        stream.style.strokeWidth = `${w}`;
        if (loc > 0) stream.style.stroke = bugColor(bugs / loc);
        label.style.display = '';
        label.textContent = `${fmt(e.locRate)} LOC/s`;
      } else {
        stream.style.display = 'none';
        label.style.display = 'none';
      }

      const want = isStream ? 0 : e.packets.length;
      while (g.childNodes.length < want) {
        const r = document.createElementNS(SVG, 'rect');
        r.setAttribute('class', 'packet');
        g.appendChild(r);
      }
      while (g.childNodes.length > want) g.removeChild(g.lastChild!);
      for (let i = 0; i < want; i++) {
        const pk = e.packets[i];
        const pt = p.getPointAtLength(Math.min(1, pk.t) * len);
        const size = 9 + Math.min(9, Math.log10(Math.max(1, pk.p.loc)) * 2);
        const r = g.childNodes[i] as SVGRectElement;
        r.setAttribute('x', `${pt.x - size / 2}`);
        r.setAttribute('y', `${pt.y - size / 2}`);
        r.setAttribute('width', `${size}`);
        r.setAttribute('height', `${size}`);
        r.setAttribute('fill', bugColor(pk.p.bugs / Math.max(1, pk.p.loc)));
        r.setAttribute('stroke', pk.p.reviewed ? '#ffffff' : '#0b0b14');
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [id]);

  return (
    <>
      <BaseEdge path={path} className={`flow-edge ${selected ? 'sel' : ''}`} interactionWidth={18} />
      <path ref={pathRef} d={path} fill="none" stroke="none" />
      <path ref={streamRef} d={path} className="stream" fill="none" style={{ display: 'none' }} />
      <g ref={gRef} />
      <text ref={labelRef} x={lx} y={ly - 12} className="edge-label" textAnchor="middle" style={{ display: 'none' }} />
    </>
  );
}

export function ModEdge(props: EdgeProps) {
  useTick(300);
  const { id, source, selected } = props;
  const [path] = getBezierPath(props);
  const on = game.s.nodes[source]?.status === 'busy';
  return <BaseEdge id={id} path={path} className={`mod-edge ${on ? 'on' : 'off'} ${selected ? 'sel' : ''}`} interactionWidth={16} />;
}
