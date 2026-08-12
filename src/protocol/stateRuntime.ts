// ============================================================
// RIDTP Deterministic State Runtime
// Algorithm 1.1: Master Runtime Dispatcher
// σ' = f(σ, m)
// ============================================================

import type { ProtocolState, ProofEnvelope } from '../types';
import { sha256Sync, canonicalize } from '../crypto';

/**
 * Create initial empty protocol state
 */
export function createInitialState(): ProtocolState {
  return {
    rootRegistry: new Map(),
    relationshipRegistry: new Map(),
    merkleRoot: '0'.repeat(64),
    sequenceNumber: 0,
  };
}

/**
 * Compute a deterministic Merkle-like root from current state
 * Simulates Sparse Merkle Tree root hash computation
 */
export function computeStateRoot(state: ProtocolState): string {
  const roots = Array.from(state.rootRegistry.keys()).sort();
  const rels = Array.from(state.relationshipRegistry.keys()).sort();

  const rootStatuses = roots.map(r => `${r}:${state.rootRegistry.get(r)!.status}`).join('|');
  const relStatuses = rels.map(r => `${r}:${state.relationshipRegistry.get(r)!.status}`).join('|');

  const payload = canonicalize({
    roots: rootStatuses,
    rels: relStatuses,
    seq: state.sequenceNumber,
  });

  return sha256Sync(payload);
}

/**
 * Commit a state change and update merkle root + sequence
 */
export function commitStateTransition(
  state: ProtocolState,
  envelope: ProofEnvelope
): ProtocolState {
  const newSeq = state.sequenceNumber + 1;
  const newRoot = sha256Sync(
    state.merkleRoot + ':' + envelope.envelopeId + ':' + newSeq
  );
  return {
    ...state,
    merkleRoot: newRoot,
    sequenceNumber: newSeq,
  };
}

/**
 * State transition messages (for UI state machine demo)
 */
export type StateMessage =
  | 'VALID_PROOF'
  | 'INVALID_SIGNATURE'
  | 'EXPIRED_PROOF'
  | 'REPLAYED_PROOF'
  | 'UNAUTHORIZED_SCOPE'
  | 'REVOKED_RELATIONSHIP';

export interface StateTransitionResult {
  fromState: string;
  toState: string;
  trigger: StateMessage;
  outcome: 'ACCEPTED' | 'REJECTED';
  newMerkleRoot?: string;
  reason?: string;
}

/**
 * Simulate FSM state transition for UI visualization
 * σ' = f(σ, m)
 */
export function simulateStateTransition(
  currentMerkleRoot: string,
  message: StateMessage,
  seqNumber: number
): StateTransitionResult {
  switch (message) {
    case 'VALID_PROOF':
      return {
        fromState: 'σ (ACTIVE)',
        toState: "σ' (ACTIVE + COMMITTED)",
        trigger: message,
        outcome: 'ACCEPTED',
        newMerkleRoot: sha256Sync(currentMerkleRoot + ':valid:' + seqNumber),
      };
    case 'INVALID_SIGNATURE':
      return {
        fromState: 'σ (ACTIVE)',
        toState: 'σ (UNCHANGED)',
        trigger: message,
        outcome: 'REJECTED',
        reason: 'ERR_SIGNATURE_INVALID: Ed25519 signature fails verification',
      };
    case 'EXPIRED_PROOF':
      return {
        fromState: 'σ (ACTIVE)',
        toState: 'σ (UNCHANGED)',
        trigger: message,
        outcome: 'REJECTED',
        reason: 'ERR_REPLAY_DETECTED: Timestamp outside 300s window',
      };
    case 'REPLAYED_PROOF':
      return {
        fromState: 'σ (ACTIVE)',
        toState: 'σ (UNCHANGED)',
        trigger: message,
        outcome: 'REJECTED',
        reason: 'ERR_REPLAY_DETECTED: Nonce already in cache',
      };
    case 'UNAUTHORIZED_SCOPE':
      return {
        fromState: 'σ (ACTIVE)',
        toState: 'σ (UNCHANGED)',
        trigger: message,
        outcome: 'REJECTED',
        reason: 'ERR_SCOPE_UNAUTHORIZED: Scope not in delegation allowlist',
      };
    case 'REVOKED_RELATIONSHIP':
      return {
        fromState: 'σ (ACTIVE)',
        toState: 'σ (UNCHANGED)',
        trigger: message,
        outcome: 'REJECTED',
        reason: 'ERR_RELATIONSHIP_REVOKED: Relationship status = REVOKED',
      };
  }
}
