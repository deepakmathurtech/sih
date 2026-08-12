// ============================================================
// RIDTP Revocation Registry
// Checks and updates revocation state
// ============================================================

import type { ProtocolState, RIDString, RRIDString } from '../types';

/**
 * Check if a Root Identity is revoked
 */
export function isRIDRevoked(rid: RIDString, state: ProtocolState): boolean {
  const identity = state.rootRegistry.get(rid);
  return identity?.status === 'REVOKED' || identity?.status === 'SUSPENDED';
}

/**
 * Check if a Relationship is revoked
 */
export function isRelationshipRevoked(rrid: RRIDString, state: ProtocolState): boolean {
  const rel = state.relationshipRegistry.get(rrid);
  return rel?.status === 'REVOKED' || rel?.status === 'SUSPENDED';
}

/**
 * Get revocation status string for a relationship
 */
export function getRevocationStatus(
  rrid: RRIDString,
  state: ProtocolState
): 'NOT_REVOKED' | 'REVOKED' | 'UNKNOWN' {
  const rel = state.relationshipRegistry.get(rrid);
  if (!rel) return 'UNKNOWN';
  if (rel.status === 'REVOKED') return 'REVOKED';
  return 'NOT_REVOKED';
}

/**
 * Revoke a Root Identity
 */
export function revokeRootIdentity(
  rid: RIDString,
  state: ProtocolState
): ProtocolState {
  const identity = state.rootRegistry.get(rid);
  if (!identity) return state;
  const newRegistry = new Map(state.rootRegistry);
  newRegistry.set(rid, { ...identity, status: 'REVOKED' });
  return { ...state, rootRegistry: newRegistry };
}
