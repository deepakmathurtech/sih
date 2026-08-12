// ============================================================
// RIDTP Relationship Object Management
// ============================================================

import type {
  RelationshipObject, ProtocolState, RIDString, RRIDString,
  RelationshipType, ProtocolStatus
} from '../types';
import { sha256Sync, generateDemoNonce } from '../crypto';

/**
 * Derive RRID from relationship parameters (synchronous demo version)
 * RRID = urn:ridtp:rel:sha256:<SHA256(canonical(ridA, ridB, nonce, timestamp))>
 */
export function deriveRRIDSync(
  ridA: RIDString,
  ridB: RIDString,
  nonce: string,
  timestamp: number
): RRIDString {
  const payload = `{"nonce":"${nonce}","ridA":"${ridA}","ridB":"${ridB}","timestamp":${timestamp}}`;
  const digest = sha256Sync(payload);
  return `urn:ridtp:rel:sha256:${digest}`;
}

/**
 * Create a RelationshipObject
 */
export function createRelationship(
  issuerRid: RIDString,
  subjectRid: RIDString,
  type: RelationshipType,
  scope: string,
  ttlSeconds: number,
  seedNonce?: string
): RelationshipObject {
  const nonce = seedNonce ? generateDemoNonce(seedNonce) : generateDemoNonce(`${issuerRid}:${subjectRid}:${Date.now()}`);
  const timestamp = Date.now();
  const rrid = deriveRRIDSync(issuerRid, subjectRid, nonce, timestamp);

  // Deterministic demo signatures
  const issuerSignature = `demo_sig_issuer_${sha256Sync(rrid + ':issuer').substring(0, 32)}`;
  const subjectSignature = `demo_sig_subject_${sha256Sync(rrid + ':subject').substring(0, 32)}`;

  return {
    rrid,
    issuerRid,
    subjectRid,
    type,
    scope,
    nonce,
    timestamp,
    ttl: ttlSeconds,
    issuerSignature,
    subjectSignature,
    status: 'ACTIVE',
    expiresAt: timestamp + ttlSeconds * 1000,
  };
}

/**
 * Resolve a RelationshipObject from state
 */
export function resolveRelationship(
  rrid: RRIDString,
  state: ProtocolState
): RelationshipObject | null {
  return state.relationshipRegistry.get(rrid) ?? null;
}

/**
 * Register a relationship in protocol state
 */
export function registerRelationship(
  rel: RelationshipObject,
  state: ProtocolState
): ProtocolState {
  const newRegistry = new Map(state.relationshipRegistry);
  newRegistry.set(rel.rrid, rel);
  return { ...state, relationshipRegistry: newRegistry };
}

/**
 * Revoke a relationship (terminal state)
 */
export function revokeRelationship(
  rrid: RRIDString,
  state: ProtocolState
): ProtocolState {
  const rel = resolveRelationship(rrid, state);
  if (!rel) return state;
  const updated: RelationshipObject = { ...rel, status: 'REVOKED' };
  const newRegistry = new Map(state.relationshipRegistry);
  newRegistry.set(rrid, updated);
  return { ...state, relationshipRegistry: newRegistry };
}

/**
 * Validate a relationship: checks status, expiry, and format
 */
export function validateRelationship(
  rel: RelationshipObject,
  state: ProtocolState
): { valid: boolean; reason?: string } {
  // Look up live state (revocation check)
  const liveRel = resolveRelationship(rel.rrid, state) ?? rel;

  if (liveRel.status === 'REVOKED') {
    return { valid: false, reason: 'Relationship has been revoked.' };
  }

  if (liveRel.status === 'SUSPENDED') {
    return { valid: false, reason: 'Relationship is suspended.' };
  }

  if (Date.now() > liveRel.expiresAt) {
    return { valid: false, reason: 'Relationship has expired.' };
  }

  return { valid: true };
}

/**
 * Transition relationship status
 */
export function transitionRelationshipStatus(
  rrid: RRIDString,
  newStatus: ProtocolStatus,
  state: ProtocolState
): ProtocolState {
  const rel = resolveRelationship(rrid, state);
  if (!rel) return state;
  const updated: RelationshipObject = { ...rel, status: newStatus };
  const newRegistry = new Map(state.relationshipRegistry);
  newRegistry.set(rrid, updated);
  return { ...state, relationshipRegistry: newRegistry };
}
