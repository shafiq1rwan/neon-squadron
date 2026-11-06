import './styles.css';
import { GameApp } from './app/GameApp';
import { applyThemeToDocument } from './ui/Theme';

async function boot(): Promise<void> {
  applyThemeToDocument();
  const canvas = document.getElementById('game-canvas');
  const uiRoot = document.getElementById('ui-root');
  if (!(canvas instanceof HTMLCanvasElement) || !(uiRoot instanceof HTMLElement)) {
    throw new Error('Missing #game-canvas or #ui-root in index.html');
  }

  try {
    const game = await GameApp.create(canvas, uiRoot);
    canvas.focus({ preventScroll: true });
    if (import.meta.env.DEV) {
      // Handy for poking at systems from the browser console during development.
      (window as unknown as { game: GameApp }).game = game;
    }
  } catch (err) {
    console.error('Failed to start Neon Squadron', err);
    showFatalError(uiRoot, 'Your browser could not start the game. Please make sure WebGL 2 is enabled and try again.');
  }
}

function showFatalError(parent: HTMLElement, message: string): void {
  const el = document.createElement('div');
  el.className = 'fatal-error';
  el.textContent = message;
  parent.appendChild(el);
}

void boot();
