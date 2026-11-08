// Thin wrapper around the Poki SDK (https://developers.poki.com/guide/sdk-html5).
// - Every call is safe when the SDK is missing (ad blocker, offline, local file).
// - gameplayStart/Stop are de-duplicated: Poki rejects the same event twice in a row.
// - Rewards are only granted when the SDK reports success. With no SDK there is no reward,
//   except in `npm run dev`, where rewards are simulated so the flow can be tested.

interface PokiSDKApi {
  init(): Promise<void>;
  gameLoadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  commercialBreak(onStart?: () => void): Promise<void>;
  rewardedBreak(onStart?: () => void): Promise<boolean>;
  movePill?(topPercent: number, topPx: number): void;
}

declare global {
  interface Window {
    PokiSDK?: PokiSDKApi;
  }
}

const sdk = (): PokiSDKApi | undefined => window.PokiSDK;

let playing = false;
let inBreak = false;

/** Called with true when an ad starts (mute + block input) and false when it ends. */
export type AdHook = (adPlaying: boolean) => void;

export const Poki = {
  async init(): Promise<void> {
    const s = sdk();
    if (!s) return;
    // Docs: continue loading the game whether init resolves or rejects. Never wait forever.
    await Promise.race([s.init().catch(() => undefined), new Promise((r) => setTimeout(r, 4000))]);
  },

  loadingFinished(): void {
    try { sdk()?.gameLoadingFinished(); } catch { /* ignore */ }
  },

  gameplayStart(): void {
    if (playing || inBreak) return;
    playing = true;
    try { sdk()?.gameplayStart(); } catch { /* ignore */ }
  },

  gameplayStop(): void {
    if (!playing) return;
    playing = false;
    try { sdk()?.gameplayStop(); } catch { /* ignore */ }
  },

  get isPlaying(): boolean {
    return playing;
  },

  /** A natural break (between runs). Poki decides whether an ad actually plays. */
  async commercialBreak(hook: AdHook): Promise<void> {
    const s = sdk();
    if (!s || inBreak) return;
    this.gameplayStop();
    inBreak = true;
    try {
      await s.commercialBreak(() => hook(true));
    } catch { /* ignore */ } finally {
      inBreak = false;
      hook(false);
    }
  },

  /** Player-chosen rewarded video. Resolves true only if the reward should be granted. */
  async rewardedBreak(hook: AdHook): Promise<boolean> {
    const s = sdk();
    if (inBreak) return false;
    if (!s) return import.meta.env.DEV ? new Promise((r) => setTimeout(() => r(true), 400)) : false;
    this.gameplayStop();
    inBreak = true;
    try {
      return !!(await s.rewardedBreak(() => hook(true)));
    } catch {
      return false;
    } finally {
      inBreak = false;
      hook(false);
    }
  },
};

// Poki: arrow keys, space and the mouse wheel must not scroll the page around the game.
// Keys are captured by Phaser (GameScene.setupInput -> addCapture): a window listener calling
// preventDefault here would run first, and Phaser ignores events that are already defaultPrevented.
window.addEventListener("wheel", (ev) => ev.preventDefault(), { passive: false });
