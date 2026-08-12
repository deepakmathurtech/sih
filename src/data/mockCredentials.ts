// ============================================================
// RIDTP Mock Credentials & Demo Scenarios
// NOTICE: All credentials are SYNTHETIC DEMONSTRATION DATA
// NOT official documents. Not a real government service.
// ============================================================

import type { RIDTPCredential, DemoScenario, RelationshipObject, ProofEnvelope } from '../types';
import { MOCK_IDENTITIES } from './mockIdentities';
import { createRelationship } from '../protocol/relationship';
import {
  createProofEnvelope,
  createTamperedProofEnvelope,
  createExpiredProofEnvelope,
} from '../protocol/proofEnvelope';
import { buildDelegationProof, MAX_DELEGATION_DEPTH } from '../protocol/delegation';
import { sha256Sync, generateDemoNonce } from '../crypto';

// ─── Build Base Relationships ─────────────────────────────────────────────────

const univRid = MOCK_IDENTITIES.shardaUniversity.rid;
const studentRid = MOCK_IDENTITIES.student.rid;
const employerRid = MOCK_IDENTITIES.employer.rid;
const registrarRid = MOCK_IDENTITIES.registrar.rid;
const officerRid = MOCK_IDENTITIES.verificationOfficer.rid;

// Scenario 1: Valid academic credential
export const validRelationship: RelationshipObject = createRelationship(
  univRid, studentRid,
  'ACADEMIC_CREDENTIAL', 'VERIFY_ENROLLMENT',
  86400, // 24 hours TTL
  'valid_scenario_seed'
);

// Scenario 2: For tampered (same rel, different proof)
const tamperedRelationship: RelationshipObject = createRelationship(
  univRid, studentRid,
  'ACADEMIC_CREDENTIAL', 'VERIFY_ENROLLMENT',
  86400, 'tampered_scenario_seed'
);

// Scenario 3: For replay (we'll use the same nonce in app store)
export const replayRelationship: RelationshipObject = createRelationship(
  univRid, studentRid,
  'ACADEMIC_CREDENTIAL', 'VERIFY_ENROLLMENT',
  86400, 'replay_scenario_seed'
);

// Scenario 4: Revocable relationship (initially active, revoked in scenario)
export const revocableRelationship: RelationshipObject = createRelationship(
  univRid, studentRid,
  'ACADEMIC_CREDENTIAL', 'VERIFY_ENROLLMENT',
  86400, 'revocable_scenario_seed'
);

// Scenario 5: Expired relationship
export const expiredRelationship: RelationshipObject = {
  ...createRelationship(univRid, studentRid, 'ACADEMIC_CREDENTIAL', 'VERIFY_ENROLLMENT', 1, 'expired_scenario_seed'),
  expiresAt: Date.now() - 500_000, // already expired
};

// Scenario 6: Delegation exceeded
export const delegationRelationship: RelationshipObject = createRelationship(
  registrarRid, officerRid,
  'ACADEMIC_CREDENTIAL', 'VERIFY_ENROLLMENT',
  86400, 'delegation_scenario_seed'
);

// ─── Build Proof Envelopes ────────────────────────────────────────────────────

const validEnvelope: ProofEnvelope = createProofEnvelope(validRelationship, 'valid_scenario_env_seed');
const tamperedEnvelope: ProofEnvelope = createTamperedProofEnvelope(tamperedRelationship);
export const replayEnvelope: ProofEnvelope = createProofEnvelope(replayRelationship, 'replay_scenario_env_seed');
const validRevocableEnvelope: ProofEnvelope = createProofEnvelope(revocableRelationship, 'revocable_scenario_env_seed');
const expiredEnvelope: ProofEnvelope = createExpiredProofEnvelope(expiredRelationship);

// Delegation exceeded envelope (depth 4 — exceeds max 3)
const delegationExceededChain = buildDelegationProof(
  registrarRid, officerRid, ['VERIFY_ENROLLMENT'], 3600, MAX_DELEGATION_DEPTH + 1 // depth 4
);
const delegationExceededEnvelope: ProofEnvelope = {
  ...createProofEnvelope(delegationRelationship, 'delegation_exceeded_env_seed'),
  delegationProof: delegationExceededChain,
};

// ─── Build Credentials ────────────────────────────────────────────────────────

export const MOCK_CREDENTIALS: Record<string, RIDTPCredential> = {
  validAcademic: {
    id: sha256Sync('valid_academic_credential').substring(0, 16),
    type: 'ACADEMIC_CREDENTIAL',
    issuerName: 'Sharda University',
    subjectName: 'Deepak Sharma',
    issuerRid: univRid,
    subjectRid: studentRid,
    proofEnvelope: validEnvelope,
    relationship: validRelationship,
    isDemo: true,
    demoLabel: 'SYNTHETIC DEMONSTRATION CREDENTIAL — NOT AN OFFICIAL DOCUMENT',
  },

  tampered: {
    id: sha256Sync('tampered_credential').substring(0, 16),
    type: 'ACADEMIC_CREDENTIAL',
    issuerName: 'Sharda University',
    subjectName: 'Deepak Sharma',
    issuerRid: univRid,
    subjectRid: studentRid,
    proofEnvelope: tamperedEnvelope,
    relationship: tamperedRelationship,
    isDemo: true,
    demoLabel: 'SYNTHETIC DEMONSTRATION CREDENTIAL — TAMPERED PROOF',
  },

  replay: {
    id: sha256Sync('replay_credential').substring(0, 16),
    type: 'ACADEMIC_CREDENTIAL',
    issuerName: 'Sharda University',
    subjectName: 'Deepak Sharma',
    issuerRid: univRid,
    subjectRid: studentRid,
    proofEnvelope: replayEnvelope,
    relationship: replayRelationship,
    isDemo: true,
    demoLabel: 'SYNTHETIC DEMONSTRATION CREDENTIAL — REPLAY ATTACK',
  },

  revocable: {
    id: sha256Sync('revocable_credential').substring(0, 16),
    type: 'ACADEMIC_CREDENTIAL',
    issuerName: 'Sharda University',
    subjectName: 'Deepak Sharma',
    issuerRid: univRid,
    subjectRid: studentRid,
    proofEnvelope: validRevocableEnvelope,
    relationship: revocableRelationship,
    isDemo: true,
    demoLabel: 'SYNTHETIC DEMONSTRATION CREDENTIAL — REVOCATION DEMO',
  },

  expired: {
    id: sha256Sync('expired_credential').substring(0, 16),
    type: 'ACADEMIC_CREDENTIAL',
    issuerName: 'Sharda University',
    subjectName: 'Deepak Sharma',
    issuerRid: univRid,
    subjectRid: studentRid,
    proofEnvelope: expiredEnvelope,
    relationship: expiredRelationship,
    isDemo: true,
    demoLabel: 'SYNTHETIC DEMONSTRATION CREDENTIAL — EXPIRED PROOF',
  },

  delegationExceeded: {
    id: sha256Sync('delegation_exceeded_credential').substring(0, 16),
    type: 'ACADEMIC_CREDENTIAL',
    issuerName: 'Sharda University Registrar',
    subjectName: 'Verification Officer',
    issuerRid: registrarRid,
    subjectRid: officerRid,
    proofEnvelope: delegationExceededEnvelope,
    relationship: delegationRelationship,
    isDemo: true,
    demoLabel: 'SYNTHETIC DEMONSTRATION CREDENTIAL — DELEGATION DEPTH EXCEEDED',
  },
};

// ─── Demo Scenarios ───────────────────────────────────────────────────────────

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'valid',
    name: 'Valid Academic Credential',
    description: 'Sharda University → Student relationship with valid dual-attested proof envelope.',
    badge: 'VERIFIED',
    badgeColor: 'emerald',
    credential: MOCK_CREDENTIALS.validAcademic,
    expectedOutcome: 'VERIFIED',
  },
  {
    id: 'tampered',
    name: 'Tampered Proof',
    description: 'Proof envelope with a corrupted issuer signature — simulating credential forgery.',
    badge: 'REJECTED',
    badgeColor: 'red',
    credential: MOCK_CREDENTIALS.tampered,
    expectedOutcome: 'REJECTED',
    expectedErrorCode: 'ERR_SIGNATURE_INVALID',
  },
  {
    id: 'replay',
    name: 'Replay Attack',
    description: 'A previously-verified proof is re-submitted. Nonce cache detects the replay.',
    badge: 'REJECTED',
    badgeColor: 'red',
    credential: MOCK_CREDENTIALS.replay,
    expectedOutcome: 'REJECTED',
    expectedErrorCode: 'ERR_REPLAY_DETECTED',
  },
  {
    id: 'revoked',
    name: 'Revoked Relationship',
    description: 'The credential relationship was revoked. Verification fails on current state check.',
    badge: 'REJECTED',
    badgeColor: 'orange',
    credential: MOCK_CREDENTIALS.revocable,
    expectedOutcome: 'REJECTED',
    expectedErrorCode: 'ERR_RELATIONSHIP_REVOKED',
  },
  {
    id: 'expired',
    name: 'Expired Proof',
    description: 'Proof envelope timestamp is outside the 300-second permitted window.',
    badge: 'EXPIRED',
    badgeColor: 'yellow',
    credential: MOCK_CREDENTIALS.expired,
    expectedOutcome: 'REJECTED',
    expectedErrorCode: 'ERR_PROOF_EXPIRED',
  },
  {
    id: 'delegation_exceeded',
    name: 'Unauthorized Delegation',
    description: 'Delegation chain depth exceeds maximum 3 hops (LAW 10.2). Authorization fails.',
    badge: 'REJECTED',
    badgeColor: 'red',
    credential: MOCK_CREDENTIALS.delegationExceeded,
    expectedOutcome: 'REJECTED',
    expectedErrorCode: 'ERR_SCOPE_UNAUTHORIZED',
  },
];
