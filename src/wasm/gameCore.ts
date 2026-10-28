import init, { apply_item, resolve_shot_damage, start_round } from './pkg/russian_roulette_core.js';
import type { Chamber } from '../types';

let wasmReady: Promise<unknown> | null = null;
const ensureWasmReady = () => {
  if (!wasmReady) {
    wasmReady = init().catch((error) => {
      wasmReady = null;
      throw error;
    });
  }
  return wasmReady;
};

export const createWasmSeed = (): number => {
  const seed = new Uint32Array(1);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(seed);
  else seed[0] = Math.floor(Math.random() * 0xffffffff);
  return seed[0];
};

export const createRound = async (seed: number): Promise<{ liveCount: number; chambers: Chamber[] }> => {
  await ensureWasmReady();
  return JSON.parse(start_round(seed)) as { liveCount: number; chambers: Chamber[] };
};

export const resolveShotDamage = async (
  baseDamage: number,
  isSelfShot: boolean,
  hasDoubleDamage: boolean,
  targetIsProtected: boolean
): Promise<number> => {
  await ensureWasmReady();
  return resolve_shot_damage(baseDamage, isSelfShot, hasDoubleDamage, targetIsProtected);
};

export interface WasmItemEffect {
  initialPatch: Record<string, unknown>;
  followUpPatch: Record<string, unknown>;
  waitTimeMs: number;
  followUpDelayMs: number;
}

export const applyWasmItem = async (
  state: unknown,
  item: string,
  user: 'player' | 'dealer',
  nowMs: number
): Promise<WasmItemEffect> => {
  await ensureWasmReady();
  return JSON.parse(apply_item(JSON.stringify(state), item, user, nowMs)) as WasmItemEffect;
};
