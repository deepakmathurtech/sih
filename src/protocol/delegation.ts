// ============================================================
// RIDTP Delegation Engine
// Bounded delegation with max depth 3 (LAW 10.2)
// ============================================================

import type { DelegationProof } from '../types';
import { sha256Sync } from '../crypto';

export const MAX_DELEGATION_DEPTH = 3;

/**
 * Build a delegation proof
 */
export function buildDelegationProof(
  delegatorRid: string,
  delegateRid: string,
  allowedScopes: string[],
  validUntilSeconds: number,
  depth: number
): DelegationProof {
  const delegationId = `urn:ridtp:del:sha256:${sha256Sync(`${delegatorRid}:${delegateRid}:${depth}`)}`;
  const delegatorSignature = `ecdsa_p256_demo:${sha256Sync(delegationId + ':delegator_sig')}`;

  return {
    delegationId,
    delegatorRid,
    delegateRid,
    allowedScopes,
    validUntil: Date.now() + validUntilSeconds * 1000,
    depth,
    maxDepth: MAX_DELEGATION_DEPTH,
    delegatorSignature,
  };
}

/**
 * Validate delegation chain depth (LAW 10.2)
 * Returns { valid: boolean; depth: number; maxDepth: number; reason?: string }
 */
export function validateDelegationDepth(
  chain: DelegationProof[]
): { valid: boolean; depth: number; maxDepth: number; reason?: string } {
  const depth = chain.length;

  if (depth > MAX_DELEGATION_DEPTH) {
    return {
      valid: false,
      depth,
      maxDepth: MAX_DELEGATION_DEPTH,
      reason: `Delegation depth exceeded. Maximum permitted depth: ${MAX_DELEGATION_DEPTH}`,
    };
  }

  return { valid: true, depth, maxDepth: MAX_DELEGATION_DEPTH };
}

/**
 * Validate that a scope is authorized in the delegation chain
 */
export function validateDelegationScope(
  chain: DelegationProof[],
  requiredScope: string
): { valid: boolean; reason?: string } {
  for (const proof of chain) {
    const hasScope = proof.allowedScopes.includes(requiredScope) || proof.allowedScopes.includes('*');
    if (!hasScope) {
      return {
        valid: false,
        reason: `Delegator ${proof.delegatorRid.slice(-8)} does not grant scope '${requiredScope}'`,
      };
    }
  }
  return { valid: true };
}

/**
 * Validate all aspects of a delegation chain
 */
export function validateDelegationChain(
  chain: DelegationProof[],
  requiredScope: string
): { valid: boolean; reason?: string; depth: number } {
  const depthCheck = validateDelegationDepth(chain);
  if (!depthCheck.valid) {
    return { valid: false, reason: depthCheck.reason, depth: depthCheck.depth };
  }

  const scopeCheck = validateDelegationScope(chain, requiredScope);
  if (!scopeCheck.valid) {
    return { valid: false, reason: scopeCheck.reason, depth: chain.length };
  }

  // Check validity windows
  const now = Date.now();
  for (const proof of chain) {
    if (proof.validUntil < now) {
      return {
        valid: false,
        reason: `Delegation from ${proof.delegatorRid.slice(-8)} has expired.`,
        depth: chain.length,
      };
    }
  }

  return { valid: true, depth: chain.length };
}

/**
 * Build demo delegation chain for UI visualization
 */
export function buildDemoDelegationChain(): {
  chain: DelegationProof[];
  nodes: { rid: string; label: string; role: string }[];
} {
  const universityRid = 'urn:ridtp:root:sha256:' + sha256Sync('Sharda_University_demo');
  const registrarRid = 'urn:ridtp:root:sha256:' + sha256Sync('Registrar_Office_demo');
  const officerRid = 'urn:ridtp:root:sha256:' + sha256Sync('Verification_Officer_demo');
  const agentRid = 'urn:ridtp:root:sha256:' + sha256Sync('External_Agent_demo');

  const d1 = buildDelegationProof(universityRid, registrarRid, ['VERIFY_ENROLLMENT', 'REL_ISSUE'], 3600, 1);
  const d2 = buildDelegationProof(registrarRid, officerRid, ['VERIFY_ENROLLMENT'], 3600, 2);
  const d3 = buildDelegationProof(officerRid, agentRid, ['VERIFY_ENROLLMENT'], 3600, 3);

  return {
    chain: [d1, d2, d3],
    nodes: [
      { rid: universityRid, label: 'Sharda University', role: 'Root Issuer' },
      { rid: registrarRid, label: 'Registrar Office', role: 'Level 1 Delegate' },
      { rid: officerRid, label: 'Verification Officer', role: 'Level 2 Delegate' },
      { rid: agentRid, label: 'External Agent', role: 'Level 3 Delegate' },
    ],
  };
}
