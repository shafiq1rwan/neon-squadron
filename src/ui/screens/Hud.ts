/**
 * Minimal gameplay HUD: health and shield pips (top-left), run time and kills (top-centre),
 * pause button (top-right). DOM is only touched when a displayed value actually changes.
 * The container ignores pointer input; only the pause button is interactive.
 */
export interface HudData {
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  seconds: number;
  kills: number;
}

export class Hud {
  private readonly root: HTMLDivElement;
  private readonly healthEl: HTMLDivElement;
  private readonly shieldEl: HTMLDivElement;
  private readonly timeEl: HTMLSpanElement;
  private readonly killsEl: HTMLSpanElement;
  private readonly last = { health: -1, maxHealth: -1, shield: -1, maxShield: -1, seconds: -1, kills: -1 };

  constructor(parent: HTMLElement, onPause: () => void) {
    this.root = document.createElement('div');
    this.root.className = 'hud';

    const status = document.createElement('div');
    status.className = 'hud__status';
    this.healthEl = document.createElement('div');
    this.healthEl.className = 'hud__pips hud__pips--health';
    this.healthEl.setAttribute('aria-label', 'Health');
    this.shieldEl = document.createElement('div');
    this.shieldEl.className = 'hud__pips hud__pips--shield';
    this.shieldEl.setAttribute('aria-label', 'Shield');
    status.append(this.healthEl, this.shieldEl);

    const centre = document.createElement('div');
    centre.className = 'hud__centre';
    this.timeEl = document.createElement('span');
    this.timeEl.className = 'hud__time';
    this.killsEl = document.createElement('span');
    this.killsEl.className = 'hud__kills';
    centre.append(this.timeEl, this.killsEl);

    const pause = document.createElement('button');
    pause.type = 'button';
    pause.className = 'icon-button hud__pause ui-interactive';
    pause.setAttribute('aria-label', 'Pause');
    pause.innerHTML = '<span class="icon-pause" aria-hidden="true"></span>';
    pause.addEventListener('click', (e) => {
      e.stopPropagation();
      onPause();
    });

    this.root.append(status, centre, pause);
    parent.appendChild(this.root);
  }

  setVisible(visible: boolean): void {
    this.root.classList.toggle('is-hidden', !visible);
  }

  update(d: HudData): void {
    const l = this.last;
    if (d.health !== l.health || d.maxHealth !== l.maxHealth) {
      renderPips(this.healthEl, d.health, d.maxHealth);
      // Pulse the bar when health drops.
      if (d.health < l.health) restartAnimation(this.healthEl, 'is-hit');
      l.health = d.health;
      l.maxHealth = d.maxHealth;
    }
    if (d.shield !== l.shield || d.maxShield !== l.maxShield) {
      renderPips(this.shieldEl, d.shield, d.maxShield);
      if (d.shield < l.shield) restartAnimation(this.shieldEl, 'is-hit');
      l.shield = d.shield;
      l.maxShield = d.maxShield;
    }
    const secs = Math.floor(d.seconds);
    if (secs !== l.seconds) {
      this.timeEl.textContent = formatTime(secs);
      l.seconds = secs;
    }
    if (d.kills !== l.kills) {
      this.killsEl.textContent = `${d.kills} DOWN`;
      l.kills = d.kills;
    }
  }
}

function renderPips(el: HTMLElement, value: number, max: number): void {
  const count = Math.max(0, Math.round(max));
  while (el.children.length < count) {
    const pip = document.createElement('span');
    pip.className = 'pip';
    el.appendChild(pip);
  }
  while (el.children.length > count) el.lastElementChild!.remove();
  for (let i = 0; i < count; i++) {
    el.children[i]!.classList.toggle('is-empty', i >= value);
  }
}

function restartAnimation(el: HTMLElement, cls: string): void {
  el.classList.remove(cls);
  void el.offsetWidth; // reflow so the animation restarts
  el.classList.add(cls);
}

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
