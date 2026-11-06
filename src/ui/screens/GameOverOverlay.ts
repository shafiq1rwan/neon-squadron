/**
 * Run-end panel with the key stats and a one-tap retry. Enter/Space also retries.
 * The full results screen (bosses, coins, main menu) arrives with the UI phase.
 */
import type { RunSummary } from '../../app/GameEvents';
import { formatTime } from './Hud';

export class GameOverOverlay {
  private readonly el: HTMLDivElement;
  private readonly stats: HTMLDListElement;
  private readonly retry: HTMLButtonElement;
  private visible = false;
  private readonly onRetry: () => void;

  private readonly handleKey = (e: KeyboardEvent) => {
    if (!this.visible || e.repeat) return;
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      this.onRetry();
    }
  };

  constructor(parent: HTMLElement, onRetry: () => void) {
    this.onRetry = onRetry;
    this.el = document.createElement('div');
    this.el.className = 'overlay';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('aria-labelledby', 'gameover-title');

    const panel = document.createElement('div');
    panel.className = 'panel panel--danger';
    const title = document.createElement('h2');
    title.id = 'gameover-title';
    title.className = 'panel__title panel__title--danger';
    title.textContent = 'SIGNAL LOST';
    this.stats = document.createElement('dl');
    this.stats.className = 'stat-list';
    this.retry = document.createElement('button');
    this.retry.type = 'button';
    this.retry.className = 'button button--primary';
    this.retry.textContent = 'RETRY';
    this.retry.addEventListener('click', () => this.onRetry());
    const hint = document.createElement('p');
    hint.className = 'panel__hint';
    hint.textContent = 'Press Enter to retry';

    panel.append(title, this.stats, this.retry, hint);
    this.el.appendChild(panel);
    parent.appendChild(this.el);
    window.addEventListener('keydown', this.handleKey);
  }

  show(summary: RunSummary): void {
    const rows: Array<[string, string]> = [
      ['Survived', formatTime(summary.duration)],
      ['Enemies defeated', String(summary.enemiesDefeated)],
      ['Coins earned', String(summary.coinsEarned)],
    ];
    this.stats.replaceChildren();
    for (const [label, value] of rows) {
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      this.stats.append(dt, dd);
    }
    this.visible = true;
    this.el.classList.add('is-visible');
    // Focus after the fade starts so keyboard users can retry immediately.
    requestAnimationFrame(() => this.retry.focus({ preventScroll: true }));
  }

  hide(): void {
    this.visible = false;
    this.el.classList.remove('is-visible');
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKey);
    this.el.remove();
  }
}
