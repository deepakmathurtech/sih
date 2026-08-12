// ============================================================
// RIDTP Protocol Tests — Runnable from UI
// 11 test cases covering all required scenarios
// ============================================================

import type { TestResult } from '../types';
import { NonceCache } from '../protocol/replayProtection';
import { createProofEnvelope, createTamperedProofEnvelope, verifyEnvelopeSignatures, parseProofEnvelope } from '../protocol/proofEnvelope';
import { validateDelegationChain, buildDelegationProof, MAX_DELEGATION_DEPTH } from '../protocol/delegation';
import { validateRelationship, revokeRelationship, createRelationship } from '../protocol/relationship';
import { createInitialState, simulateStateTransition } from '../protocol/stateRuntime';
import { registerRelationship } from '../protocol/relationship';
import { MOCK_IDENTITIES } from '../data/mockIdentities';

type TestFn = () => Promise<{ passed: boolean; error?: string }>;

async function runTest(name: string, fn: TestFn): Promise<TestResult> {
  const start = performance.now();
  try {
    const { passed, error } = await fn();
    return {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      status: passed ? 'pass' : 'fail',
      latencyMs: performance.now() - start,
      error,
    };
  } catch (e) {
    return {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      status: 'fail',
      latencyMs: performance.now() - start,
      error: String(e),
    };
  }
}

export async function runProtocolTests(): Promise<TestResult[]> {
  const univRid = MOCK_IDENTITIES.shardaUniversity.rid;
  const studentRid = MOCK_IDENTITIES.student.rid;
  const registrarRid = MOCK_IDENTITIES.registrar.rid;
  const officerRid = MOCK_IDENTITIES.verificationOfficer.rid;

  const tests: Promise<TestResult>[] = [

    // Test 1: Valid signature
    runTest('Valid Issuer Signature', async () => {
      const rel = createRelationship(univRid, studentRid, 'ACADEMIC_CREDENTIAL', 'VERIFY_ENROLLMENT', 3600, 't1');
      const env = createProofEnvelope(rel, 't1_env');
      const state = createInitialState();
      const { issuerValid } = verifyEnvelopeSignatures(env, state);
      return { passed: issuerValid };
    }),

    // Test 2: Invalid signature (tampered)
    runTest('Invalid Signature Detected', async () => {
      const rel = createRelationship(univRid, studentRid, 'ACADEMIC_CREDENTIAL', 'VERIFY_ENROLLMENT', 3600, 't2');
      const env = createTamperedProofEnvelope(rel);
      const state = createInitialState();
      const { issuerValid } = verifyEnvelopeSignatures(env, state);
      return { passed: !issuerValid };
    }),

    // Test 3: Valid relationship
    runTest('Valid Relationship Accepted', async () => {
      const rel = createRelationship(univRid, studentRid, 'ACADEMIC_CREDENTIAL', 'VERIFY_ENROLLMENT', 3600, 't3');
      let state = createInitialState();
      state = registerRelationship(rel, state);
      const result = validateRelationship(rel, state);
      return { passed: result.valid };
    }),

    // Test 4: Revoked relationship
    runTest('Revoked Relationship Rejected', async () => {
      const rel = createRelationship(univRid, studentRid, 'ACADEMIC_CREDENTIAL', 'VERIFY_ENROLLMENT', 3600, 't4');
      let state = createInitialState();
      state = registerRelationship(rel, state);
      state = revokeRelationship(rel.rrid, state);
      const liveRel = state.relationshipRegistry.get(rel.rrid)!;
      const result = validateRelationship(liveRel, state);
      return { passed: !result.valid && result.reason?.includes('revoked') };
    }),

    // Test 5: Replay protection — nonce cache
    runTest('Replay Attack Detected (Nonce)', async () => {
      const cache = new NonceCache();
      cache.add('test_nonce_t5', Date.now(), 'env_001');
      const { passed: replayPassed } = await import('../protocol/replayProtection').then(m => {
        const result = m.checkReplay('test_nonce_t5', Date.now(), cache);
        return { passed: Boolean(!result.passed) };
      });
      return { passed: Boolean(replayPassed) };
    }),

    // Test 6: Expired proof (timestamp outside window)
    runTest('Expired Proof Rejected (Timestamp)', async () => {
      const { checkTimestampWindow } = await import('../protocol/replayProtection');
      const oldTimestamp = Date.now() - 400_000; // 400s ago
      const result = checkTimestampWindow(oldTimestamp, 300);
      return { passed: !result.valid };
    }),

    // Test 7: Valid delegation chain (depth 3)
    runTest('Valid Delegation Chain (Depth 3)', async () => {
      const d1 = buildDelegationProof(univRid, registrarRid, ['VERIFY_ENROLLMENT'], 3600, 1);
      const d2 = buildDelegationProof(registrarRid, officerRid, ['VERIFY_ENROLLMENT'], 3600, 2);
      const d3 = buildDelegationProof(officerRid, studentRid, ['VERIFY_ENROLLMENT'], 3600, 3);
      const result = validateDelegationChain([d1, d2, d3], 'VERIFY_ENROLLMENT');
      return { passed: result.valid };
    }),

    // Test 8: Invalid delegation depth (> 3)
    runTest('Delegation Depth Exceeded Rejected', async () => {
      const d1 = buildDelegationProof(univRid, registrarRid, ['VERIFY_ENROLLMENT'], 3600, 1);
      const d2 = buildDelegationProof(registrarRid, officerRid, ['VERIFY_ENROLLMENT'], 3600, 2);
      const d3 = buildDelegationProof(officerRid, studentRid, ['VERIFY_ENROLLMENT'], 3600, 3);
      const d4 = buildDelegationProof(studentRid, MOCK_IDENTITIES.employer.rid, ['VERIFY_ENROLLMENT'], 3600, 4);
      const result = validateDelegationChain([d1, d2, d3, d4], 'VERIFY_ENROLLMENT');
      return { passed: !result.valid && result.depth > MAX_DELEGATION_DEPTH };
    }),

    // Test 9: Invalid scope in delegation
    runTest('Unauthorized Scope Rejected', async () => {
      const d1 = buildDelegationProof(univRid, registrarRid, ['REL_ISSUE'], 3600, 1);
      const result = validateDelegationChain([d1], 'VERIFY_ENROLLMENT'); // wrong scope
      return { passed: !result.valid };
    }),

    // Test 10: Deterministic state transition
    runTest('Deterministic State Transition', async () => {
      const root = 'a'.repeat(64);
      const r1 = simulateStateTransition(root, 'VALID_PROOF', 1);
      const r2 = simulateStateTransition(root, 'VALID_PROOF', 1);
      return { passed: r1.newMerkleRoot === r2.newMerkleRoot && r1.outcome === 'ACCEPTED' };
    }),

    // Test 11: Malformed envelope rejected
    runTest('Malformed Envelope Rejected', async () => {
      const { envelope, error } = parseProofEnvelope({ notAProof: true });
      return { passed: envelope === null && !!error };
    }),
  ];

  return Promise.all(tests);
}
