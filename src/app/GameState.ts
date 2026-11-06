/**
 * Centralised game-state machine. All systems ask this object whether the simulation
 * should run instead of keeping their own paused flags, so pausing (or ads, or upgrade
 * selection) freezes every gameplay timer at once.
 */

export const GameStates = [
  'BOOT',
  'LOADING',
  'MAIN_MENU',
  'PLAYING',
  'UPGRADE_SELECTION',
  'BOSS_BATTLE',
  'PAUSED',
  'HANGAR',
  'SETTINGS',
  'GAME_OVER',
  'RESULTS',
  'AD_BREAK',
] as const;

export type GameStateId = (typeof GameStates)[number];

/** Allowed transitions. Anything not listed is rejected. */
const TRANSITIONS: Record<GameStateId, readonly GameStateId[]> = {
  BOOT: ['LOADING'],
  LOADING: ['MAIN_MENU', 'PLAYING'],
  MAIN_MENU: ['PLAYING', 'HANGAR', 'SETTINGS', 'AD_BREAK'],
  PLAYING: ['PAUSED', 'UPGRADE_SELECTION', 'BOSS_BATTLE', 'GAME_OVER', 'RESULTS'],
  UPGRADE_SELECTION: ['PLAYING', 'BOSS_BATTLE', 'PAUSED'],
  BOSS_BATTLE: ['PAUSED', 'UPGRADE_SELECTION', 'PLAYING', 'GAME_OVER', 'RESULTS'],
  PAUSED: ['PLAYING', 'BOSS_BATTLE', 'UPGRADE_SELECTION', 'SETTINGS', 'MAIN_MENU', 'LOADING'],
  HANGAR: ['MAIN_MENU'],
  SETTINGS: ['MAIN_MENU', 'PAUSED'],
  GAME_OVER: ['PLAYING', 'MAIN_MENU', 'AD_BREAK', 'LOADING'],
  RESULTS: ['PLAYING', 'MAIN_MENU', 'AD_BREAK', 'LOADING'],
  AD_BREAK: ['PLAYING', 'MAIN_MENU', 'GAME_OVER', 'RESULTS'],
};

/** States in which combat simulation (movement, projectiles, timers) advances. */
const SIMULATION_STATES: ReadonlySet<GameStateId> = new Set(['PLAYING', 'BOSS_BATTLE']);

/** States in which the player may steer the aircraft. */
const PLAYER_INPUT_STATES: ReadonlySet<GameStateId> = new Set(['PLAYING', 'BOSS_BATTLE']);

/** States that can be interrupted by a pause. */
const PAUSABLE_STATES: ReadonlySet<GameStateId> = new Set([
  'PLAYING',
  'BOSS_BATTLE',
  'UPGRADE_SELECTION',
]);

export interface StateChange {
  from: GameStateId;
  to: GameStateId;
}

export type StateListener = (change: StateChange) => void;

export class GameStateMachine {
  private current: GameStateId = 'BOOT';
  private resumeTarget: GameStateId | null = null;
  private readonly listeners = new Set<StateListener>();

  get state(): GameStateId {
    return this.current;
  }

  get isSimulationActive(): boolean {
    return SIMULATION_STATES.has(this.current);
  }

  get acceptsPlayerInput(): boolean {
    return PLAYER_INPUT_STATES.has(this.current);
  }

  get isPaused(): boolean {
    return this.current === 'PAUSED';
  }

  canTransition(to: GameStateId): boolean {
    return TRANSITIONS[this.current].includes(to);
  }

  /** Performs a transition. Throws on contradictory transitions so bugs surface early. */
  transition(to: GameStateId): void {
    if (!this.canTransition(to)) {
      throw new Error(`Illegal game state transition ${this.current} -> ${to}`);
    }
    const from = this.current;
    this.current = to;
    if (to !== 'PAUSED' && to !== 'SETTINGS') {
      this.resumeTarget = null;
    }
    for (const listener of [...this.listeners]) listener({ from, to });
  }

  /** Transitions only if legal; returns whether it happened. */
  tryTransition(to: GameStateId): boolean {
    if (!this.canTransition(to)) return false;
    this.transition(to);
    return true;
  }

  /** Pauses the current gameplay state and remembers where to return. */
  pause(): boolean {
    if (!PAUSABLE_STATES.has(this.current)) return false;
    const target = this.current;
    this.transition('PAUSED');
    this.resumeTarget = target;
    return true;
  }

  /** Returns to the state that was active before pause(). */
  resume(): boolean {
    if (this.current !== 'PAUSED' || !this.resumeTarget) return false;
    const target = this.resumeTarget;
    this.transition(target);
    return true;
  }

  togglePause(): boolean {
    return this.isPaused ? this.resume() : this.pause();
  }

  onChange(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
