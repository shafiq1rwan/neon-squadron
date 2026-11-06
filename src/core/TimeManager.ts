/**
 * Fixed-timestep clock with bounded catch-up.
 *
 * Each rendered frame feeds the real delta in via advance(); the manager returns how many
 * fixed simulation steps to run and exposes `alpha` (0..1) so renderers can interpolate
 * between the previous and current simulation states.
 */
export interface TimeConfig {
  fixedDt: number;
  maxStepsPerFrame: number;
  maxFrameDelta: number;
}

export class TimeManager {
  readonly fixedDt: number;
  private readonly maxSteps: number;
  private readonly maxFrameDelta: number;

  private accumulator = 0;
  /** Total simulated seconds (only advances while the simulation runs). */
  simTime = 0;
  /** Number of fixed steps executed since start/reset. */
  tick = 0;
  /** Interpolation factor between previous and current simulation state. */
  alpha = 0;
  /** Seconds of wall time that were dropped because the frame was too slow. */
  droppedTime = 0;

  constructor(config: TimeConfig) {
    if (config.fixedDt <= 0) throw new Error('fixedDt must be positive');
    this.fixedDt = config.fixedDt;
    this.maxSteps = Math.max(1, Math.floor(config.maxStepsPerFrame));
    this.maxFrameDelta = config.maxFrameDelta;
  }

  /**
   * Adds real elapsed time and returns how many fixed steps the caller must run now.
   * When `running` is false the accumulator is frozen, so paused time never leaks in.
   */
  advance(realDelta: number, running: boolean): number {
    if (!running) return 0;
    const delta = Math.min(Math.max(realDelta, 0), this.maxFrameDelta);
    this.accumulator += delta;

    let steps = Math.floor(this.accumulator / this.fixedDt + 1e-9);
    if (steps > this.maxSteps) {
      const excess = (steps - this.maxSteps) * this.fixedDt;
      this.droppedTime += excess;
      this.accumulator -= excess;
      steps = this.maxSteps;
    }
    this.accumulator -= steps * this.fixedDt;
    if (this.accumulator < 0) this.accumulator = 0;
    this.simTime += steps * this.fixedDt;
    this.tick += steps;
    this.alpha = this.accumulator / this.fixedDt;
    return steps;
  }

  /**
   * Simulation time corresponding to what is being rendered this frame
   * (between the previous and current step).
   */
  get renderTime(): number {
    return this.simTime - this.fixedDt + this.alpha * this.fixedDt;
  }

  reset(): void {
    this.accumulator = 0;
    this.simTime = 0;
    this.tick = 0;
    this.alpha = 0;
    this.droppedTime = 0;
  }
}
