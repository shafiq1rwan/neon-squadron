/**
 * Development-only performance readout. Created only when import.meta.env.DEV is true,
 * so it is tree-shaken from production builds. Toggle with the backquote (`) key or F3.
 *
 * Text is refreshed twice per second, not every frame, to avoid layout churn.
 */
export interface PerfSnapshot {
  drawCalls: number;
  renderScale: number;
  backbuffer: string;
  state: string;
  seed: string;
  inputMode: string;
  quality: string;
  simSteps: number;
  droppedMs: number;
  activeChunks: number;
  activeProps: number;
  pooledProps: number;
  meshCacheSize: number;
  enemies: number;
  pooledEnemies: number;
  playerProjectiles: number;
  enemyProjectiles: number;
  particles: number;
  narrowTests: number;
}

export class PerformanceOverlay {
  private readonly el: HTMLDivElement;
  private visible = true;
  private frames = 0;
  private elapsed = 0;
  private worstFrame = 0;
  private stepsAccum = 0;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'perf-overlay';
    parent.appendChild(this.el);
  }

  toggle(): void {
    this.visible = !this.visible;
    this.el.style.display = this.visible ? '' : 'none';
  }

  /** Call every frame with the real frame delta; `snapshot` is only invoked on refresh. */
  update(frameDt: number, steps: number, snapshot: () => PerfSnapshot): void {
    this.frames++;
    this.elapsed += frameDt;
    this.stepsAccum += steps;
    this.worstFrame = Math.max(this.worstFrame, frameDt);
    if (this.elapsed < 0.5) return;

    if (this.visible) {
      const s = snapshot();
      const fps = this.frames / this.elapsed;
      const avgMs = (this.elapsed / this.frames) * 1000;
      this.el.textContent = [
        `FPS ${fps.toFixed(0).padStart(3)}  ${avgMs.toFixed(2)}ms  worst ${(this.worstFrame * 1000).toFixed(1)}ms`,
        `sim steps/frame ${(this.stepsAccum / this.frames).toFixed(2)}  dropped ${s.droppedMs.toFixed(0)}ms`,
        `draw calls ${s.drawCalls}`,
        `res ${s.backbuffer} @${s.renderScale.toFixed(2)}x  quality ${s.quality}`,
        `enemies ${s.enemies}/${s.pooledEnemies} pooled  shots ${s.playerProjectiles}+${s.enemyProjectiles}  particles ${s.particles}`,
        `collision narrow tests ${s.narrowTests}`,
        `chunks ${s.activeChunks}  props ${s.activeProps}/${s.pooledProps} pooled  meshes ${s.meshCacheSize}`,
        `state ${s.state}  input ${s.inputMode}`,
        `seed ${s.seed}`,
      ].join('\n');
    }
    this.frames = 0;
    this.elapsed = 0;
    this.worstFrame = 0;
    this.stepsAccum = 0;
  }
}
