import { useMemo, useState } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Handle, Position, type Edge, type Node, type NodeProps } from '@xyflow/react';
import { game } from '../game/engine';
import { SKILLS, SKILL_MAP, type Skill } from '../game/skills';
import { DEFS } from '../game/defs';
import { fmt } from '../game/format';
import { Sprite } from '../sprites/Sprite';
import { useTick } from './hooks';

const SX = 150;
const SY = 120;

type Vis = 'owned' | 'available' | 'hidden-ish' | 'hidden';

function visibility(sk: Skill): Vis {
  const owned = game.s.skills;
  if (owned.includes(sk.id)) return 'owned';
  if (sk.requires.every((r) => owned.includes(r))) return 'available';
  // one step beyond the frontier: shown as a mystery
  if (sk.requires.some((r) => SKILL_MAP[r] && SKILL_MAP[r].requires.every((rr) => owned.includes(rr)))) return 'hidden-ish';
  return 'hidden';
}

const ICON: Record<string, string> = { root: '★', velocity: '»', rigor: '✓', infra: '⚙', product: '$' };

function SkillNode({ data }: NodeProps) {
  useTick(200);
  const sk = SKILL_MAP[(data as { id: string }).id];
  const vis = visibility(sk);
  const afford = game.s.insight >= sk.cost;
  const unlockDef = sk.unlock ? DEFS[sk.unlock] : null;
  return (
    <div
      className={`skill br-${sk.branch} v-${vis} ${vis === 'available' && afford ? 'afford' : ''}`}
      onClick={() => vis === 'available' && game.buySkill(sk.id)}
    >
      <Handle type="target" position={Position.Top} className="skill-handle" isConnectable={false} />
      <div className="skill-badge">
        {vis === 'hidden-ish' ? '?' : unlockDef ? <Sprite id={unlockDef.sprite} scale={2} /> : ICON[sk.branch]}
      </div>
      <div className="skill-name">{vis === 'hidden-ish' ? '???' : sk.name}</div>
      {vis === 'available' && <div className="skill-cost">{fmt(sk.cost)} 💡</div>}
      <Handle type="source" position={Position.Bottom} className="skill-handle" isConnectable={false} />
    </div>
  );
}

const nodeTypes = { skill: SkillNode };

function Tree({ onClose }: { onClose: () => void }) {
  useTick(250);
  const [hover, setHover] = useState<string | null>(null);
  const key = game.s.skills.join(',');
  const { nodes, edges } = useMemo(() => {
    const visible = SKILLS.filter((s) => visibility(s) !== 'hidden');
    const ids = new Set(visible.map((s) => s.id));
    const nodes: Node[] = visible.map((s) => ({
      id: s.id,
      type: 'skill',
      position: { x: s.x * SX, y: s.y * SY },
      data: { id: s.id },
      draggable: false,
      selectable: false,
    }));
    const edges: Edge[] = [];
    for (const s of visible)
      for (const r of s.requires)
        if (ids.has(r))
          edges.push({
            id: `${r}-${s.id}`,
            source: r,
            target: s.id,
            type: 'straight',
            className: `skill-edge ${game.s.skills.includes(s.id) ? 'lit' : ''}`,
          });
    return { nodes, edges };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const hs = hover ? SKILL_MAP[hover] : null;
  const hv = hs ? visibility(hs) : null;

  return (
    <div className="tree-overlay">
      <div className="tree-head">
        <div className="tree-title">Skill Tree</div>
        <div className="tree-insight">{fmt(game.s.insight)} 💡 insight</div>
        <button className="btn" onClick={onClose}>
          Close (Esc)
        </button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
        minZoom={0.3}
        maxZoom={1.5}
        nodesConnectable={false}
        onNodeMouseEnter={(_, n) => setHover(n.id)}
        onNodeMouseLeave={() => setHover(null)}

      >
        <Background color="#26264a" gap={24} size={2} />
      </ReactFlow>
      <div className="tree-legend">
        <span className="br-velocity">» Velocity</span>
        <span className="br-rigor">✓ Rigor</span>
        <span className="br-infra">⚙ Infra</span>
        <span className="br-product">$ Product</span>
      </div>
      {hs && hv !== 'hidden-ish' && (
        <div className="tree-tooltip">
          <div className="tt-name">{hs.name}</div>
          <div className="tt-desc">{hs.desc}</div>
          {hv === 'owned' ? (
            <div className="tt-owned">✓ Learned</div>
          ) : (
            <div className={`tt-cost ${game.s.insight >= hs.cost ? 'ok' : ''}`}>{fmt(hs.cost)} 💡</div>
          )}
        </div>
      )}
    </div>
  );
}

export function SkillTree({ onClose }: { onClose: () => void }) {
  return (
    <ReactFlowProvider>
      <Tree onClose={onClose} />
    </ReactFlowProvider>
  );
}
