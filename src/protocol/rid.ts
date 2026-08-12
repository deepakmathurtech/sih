// ============================================================
// RIDTP Root Identity Management
// ============================================================

import type { RootIdentity, EntityType, ProtocolStatus, ProtocolState, RIDString } from '../types';
import { sha256Sync } from '../crypto';

/**
 * Derive RID from public key and entity type (synchronous demo version)
 */
export function deriveRIDSync(publicKeyHex: string, entityType: EntityType): RIDString {
  const payload = `{"alg":"ECDSA-P256-demo","entityType":"${entityType}","pub":"${publicKeyHex}"}`;
  const digest = sha256Sync(payload);
  return `urn:ridtp:root:sha256:${digest}`;
}

/**
 * Validate RID format (ABNF check)
 */
export function validateRIDFormat(rid: string): boolean {
  return /^urn:ridtp:root:sha256:[0-9a-f]{64}$/.test(rid);
}

/**
 * Resolve a RootIdentity from protocol state
 */
export function resolveRID(rid: RIDString, state: ProtocolState): RootIdentity | null {
  return state.rootRegistry.get(rid) ?? null;
}

/**
 * Register a new RootIdentity into state (returns updated state)
 */
export function registerRootIdentity(
  identity: Omit<RootIdentity, 'status' | 'registeredAt'>,
  state: ProtocolState
): ProtocolState {
  const newIdentity: RootIdentity = {
    ...identity,
    status: 'ACTIVE',
    registeredAt: Date.now(),
  };
  const newRegistry = new Map(state.rootRegistry);
  newRegistry.set(identity.rid, newIdentity);
  return { ...state, rootRegistry: newRegistry };
}

/**
 * Check if a RootIdentity is active
 */
export function isRootActive(rid: RIDString, state: ProtocolState): boolean {
  const identity = resolveRID(rid, state);
  return identity?.status === 'ACTIVE';
}

/**
 * Transition root status
 */
export function transitionRootStatus(
  rid: RIDString,
  newStatus: ProtocolStatus,
  state: ProtocolState
): ProtocolState {
  const identity = resolveRID(rid, state);
  if (!identity) return state;

  const updated: RootIdentity = { ...identity, status: newStatus };
  const newRegistry = new Map(state.rootRegistry);
  newRegistry.set(rid, updated);
  return { ...state, rootRegistry: newRegistry };
}
