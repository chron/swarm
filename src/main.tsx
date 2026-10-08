import { createRoot } from 'react-dom/client';
import '@xyflow/react/dist/style.css';
import './styles.css';
import App from './App';
import { game } from './game/engine';

game.load();
const speed = Number(new URLSearchParams(location.search).get('speed'));
if (speed > 0) game.timeScale = speed;

let last = performance.now();
const loop = (now: number) => {
  game.tick((now - last) / 1000);
  last = now;
  requestAnimationFrame(loop);
};
requestAnimationFrame(loop);

setInterval(() => game.save(), 5000);
window.addEventListener('beforeunload', () => game.save());

createRoot(document.getElementById('root')!).render(<App />);
