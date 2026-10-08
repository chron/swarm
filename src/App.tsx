import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react';
import { game } from './game/engine';
import { GameNode } from './ui/GameNode';
import { ModEdge, PacketEdge } from './ui/Edges';
import { Hud, Inspector, Tip, Toasts, Toolbox, newToast } from './ui/Panels';
import { SkillTree } from './ui/SkillTree';
import { EndScreen } from './ui/EndScreen';

const nodeTypes = { game: GameNode };
const edgeTypes = { packet: PacketEdge, mod: ModEdge };

function toRfNodes(prev: Node[]): Node[] {
  const sel = new Set(prev.filter((n) => n.selected).map((n) => n.id));
  return Object.values(game.s.nodes).map((n) => ({
    id: n.id,
    type: 'game',
    position: { x: n.x, y: n.y },
    data: {},
    selected: sel.has(n.id),
    deletable: !game.def(n).unique,
  }));
}

function toRfEdges(prev: Edge[]): Edge[] {
  const sel = new Set(prev.filter((e) => e.selected).map((e) => e.id));
  return game.s.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    type: e.kind === 'flow' ? 'packet' : 'mod',
    selected: sel.has(e.id),
  }));
}

function Board() {
  const [nodes, setNodes] = useState<Node[]>(() => toRfNodes([]));
  const [edges, setEdges] = useState<Edge[]>(() => toRfEdges([]));
  const [treeOpen, setTreeOpen] = useState(false);
  const [ended, setEnded] = useState(false);
  const [toasts, setToasts] = useState<ReturnType<typeof newToast>[]>([]);

  const toast = useCallback((text: string) => {
    const t = newToast(text);
    setToasts((ts) => [...ts, t]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== t.id)), 2500);
  }, []);

  useEffect(
    () =>
      game.onStructure(() => {
        setNodes((prev) => toRfNodes(prev));
        setEdges((prev) => toRfEdges(prev));
      }),
    [],
  );

  useEffect(() => game.onEvent((e) => e.kind === 'win' && setEnded(true)), []);

  // mash the keyboard to write code
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTreeOpen(false);
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || treeOpen) return;
      if (e.key.length === 1) game.click('you');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [treeOpen]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    for (const c of changes) if (c.type === 'position' && c.position) game.move(c.id, c.position.x, c.position.y);
    setNodes((ns) => applyNodeChanges(changes.filter((c) => c.type !== 'remove'), ns));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((es) => applyEdgeChanges(changes.filter((c) => c.type !== 'remove'), es));
  }, []);

  const onConnect = useCallback(
    (c: Connection) => {
      const err = game.connect(c);
      if (err) toast(err);
    },
    [toast],
  );

  const selected = nodes.find((n) => n.selected)?.id ?? null;

  return (
    <div className="app">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesDelete={(ns) => ns.forEach((n) => game.sell(n.id))}
        onEdgesDelete={(es) => es.forEach((e) => game.disconnect(e.id))}
        onEdgeDoubleClick={(_, e) => game.disconnect(e.id)}
        isValidConnection={(c) => game.validate(c as Connection) === null}
        fitView
        fitViewOptions={{ padding: 0.6, maxZoom: 1 }}
        minZoom={0.15}
        maxZoom={1.6}
        deleteKeyCode={['Backspace', 'Delete']}

      >
        <Background color="#23233f" gap={28} size={2} />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>
      <Hud onTree={() => setTreeOpen(true)} />
      <Toolbox />
      <Inspector id={selected} />
      <Tip />
      <Toasts extra={toasts} />
      {treeOpen && <SkillTree onClose={() => setTreeOpen(false)} />}
      {ended && <EndScreen onContinue={() => setEnded(false)} />}
      <button
        className="reset-btn"
        onClick={() => {
          if (confirm('Wipe your save and start over?')) game.reset();
        }}
      >
        reset
      </button>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Board />
    </ReactFlowProvider>
  );
}
