import { describe, expect, it } from 'vitest';
import { GameStateMachine } from '../src/app/GameState';

function playing(): GameStateMachine {
  const sm = new GameStateMachine();
  sm.transition('LOADING');
  sm.transition('MAIN_MENU');
  sm.transition('PLAYING');
  return sm;
}

describe('GameStateMachine', () => {
  it('starts in BOOT with simulation inactive', () => {
    const sm = new GameStateMachine();
    expect(sm.state).toBe('BOOT');
    expect(sm.isSimulationActive).toBe(false);
  });

  it('rejects contradictory transitions', () => {
    const sm = new GameStateMachine();
    expect(() => sm.transition('PLAYING')).toThrow();
    const p = playing();
    expect(p.canTransition('HANGAR')).toBe(false);
    expect(p.tryTransition('HANGAR')).toBe(false);
    expect(p.state).toBe('PLAYING');
  });

  it('only simulates and accepts input during combat states', () => {
    const sm = playing();
    expect(sm.isSimulationActive).toBe(true);
    expect(sm.acceptsPlayerInput).toBe(true);
    sm.transition('UPGRADE_SELECTION');
    expect(sm.isSimulationActive).toBe(false);
    expect(sm.acceptsPlayerInput).toBe(false);
  });

  it('pause/resume returns to the previous state', () => {
    const sm = playing();
    sm.transition('BOSS_BATTLE');
    expect(sm.pause()).toBe(true);
    expect(sm.state).toBe('PAUSED');
    expect(sm.isSimulationActive).toBe(false);
    expect(sm.resume()).toBe(true);
    expect(sm.state).toBe('BOSS_BATTLE');
  });

  it('cannot pause outside gameplay and cannot resume when not paused', () => {
    const sm = new GameStateMachine();
    sm.transition('LOADING');
    sm.transition('MAIN_MENU');
    expect(sm.pause()).toBe(false);
    expect(sm.resume()).toBe(false);
  });

  it('game over stops simulation and allows a quick retry', () => {
    const sm = playing();
    sm.transition('GAME_OVER');
    expect(sm.isSimulationActive).toBe(false);
    expect(sm.canTransition('PLAYING')).toBe(true);
  });

  it('notifies listeners with from/to', () => {
    const sm = playing();
    const seen: string[] = [];
    const off = sm.onChange(({ from, to }) => seen.push(`${from}->${to}`));
    sm.togglePause();
    sm.togglePause();
    off();
    sm.togglePause();
    expect(seen).toEqual(['PLAYING->PAUSED', 'PAUSED->PLAYING']);
  });
});
