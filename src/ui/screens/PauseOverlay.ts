/**
 * Minimal pause overlay for the foundation build: dims the scene and resumes on tap/click.
 * The full pause menu (resume / restart / settings / main menu) replaces this in the UI phase.
 */
export class PauseOverlay {
  private readonly el: HTMLDivElement;

  constructor(parent: HTMLElement, onResume: () => void) {
    this.el = document.createElement('div');
    this.el.className = 'pause-overlay';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-label', 'Paused');
    this.el.innerHTML = `
      <div class="pause-overlay__title">PAUSED</div>
      <div class="pause-overlay__hint">Tap or press Esc to resume</div>
    `;
    this.el.addEventListener('pointerup', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onResume();
    });
    parent.appendChild(this.el);
  }

  setVisible(visible: boolean): void {
    this.el.classList.toggle('is-visible', visible);
  }
}
