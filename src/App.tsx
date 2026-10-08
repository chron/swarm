import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
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
import { DebtVignette, PauseScreen, TitleScreen } from './ui/Screens';
import { HintLayer } from './ui/Hints';

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
  const [onTitle, setOnTitle] = useState(true);
  const [paused, setPaused] = useState(false);
  const rf = useReactFlow();

  useEffect(() => {
    game.paused = onTitle || paused;
  }, [onTitle, paused]);
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
      if (e.key === 'Escape' && !onTitle) {
        if (treeOpen) setTreeOpen(false);
        else setPaused((p) => !p);
        return;
      }
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || treeOpen || onTitle || paused) return;
      if (e.key.length === 1) game.click('you');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [treeOpen, onTitle, paused]);

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

  // drag a cable's end to re-plug it, or drop it on empty canvas to unplug
  const reconnected = useRef(false);
  const onReconnectStart = useCallback(() => {
    reconnected.current = false;
  }, []);
  const onReconnect = useCallback(
    (old: Edge, c: Connection) => {
      reconnected.current = true;
      const backup = game.edge(old.id);
      game.disconnect(old.id);
      const err = game.connect(c);
      if (err) {
        toast(err);
        if (backup) game.connect({ source: backup.source, sourceHandle: backup.sourceHandle, target: backup.target, targetHandle: backup.targetHandle });
      }
    },
    [toast],
  );
  const onReconnectEnd = useCallback((_: unknown, edge: Edge) => {
    if (!reconnected.current) game.disconnect(edge.id);
    reconnected.current = true;
  }, []);

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
        onReconnectStart={onReconnectStart}
        onReconnect={onReconnect}
        onReconnectEnd={onReconnectEnd}
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
      <DebtVignette />
      <HintLayer />
      {treeOpen && <SkillTree onClose={() => setTreeOpen(false)} />}
      {paused && (
        <PauseScreen
          onResume={() => setPaused(false)}
          onTitle={() => {
            setPaused(false);
            setOnTitle(true);
          }}
        />
      )}
      {onTitle && (
        <TitleScreen
          onStart={() => {
            setOnTitle(false);
            setTimeout(() => rf.fitView({ padding: 0.3, maxZoom: 1, duration: 300 }), 50);
          }}
        />
      )}
      {ended && <EndScreen onContinue={() => setEnded(false)} />}
      <button className="reset-btn" onClick={() => setPaused(true)}>
        ❚❚ pause (esc)
      </button>
    </div>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="crash">
        <div className="crash-card">
          <div className="crash-title">🔥 The game crashed (ironic, given the theme)</div>
          <pre>{`${error.message}\n\n${error.stack ?? ''}`.slice(0, 2000)}</pre>
          <div className="end-buttons">
            <button className="btn" onClick={() => location.reload()}>
              Reload (your save is kept)
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <ReactFlowProvider>
        <Board />
      </ReactFlowProvider>
    </ErrorBoundary>
  );
}
