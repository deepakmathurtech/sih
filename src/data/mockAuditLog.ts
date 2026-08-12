// ============================================================
// RIDTP Mock Audit Log — Pre-seeded events
// ============================================================

import type { AuditEvent } from '../types';
import { sha256Sync } from '../crypto';
import { MOCK_IDENTITIES } from './mockIdentities';

const univRid = MOCK_IDENTITIES.shardaUniversity.rid;
const studentRid = MOCK_IDENTITIES.student.rid;
const employerRid = MOCK_IDENTITIES.employer.rid;

function makeHash(seed: string) {
  return sha256Sync(seed).substring(0, 32);
}

const baseTime = Date.now() - 3 * 3600 * 1000; // 3 hours ago

export const INITIAL_AUDIT_LOG: AuditEvent[] = [
  {
    eventId: makeHash('event_001'),
    eventType: 'ROOT_REGISTERED',
    timestamp: baseTime,
    actorRid: univRid,
    eventHash: makeHash('event_001_hash'),
    prevCommitment: '0'.repeat(32),
    currentCommitment: makeHash('commit_001'),
    details: 'Sharda University registered Root Identity',
    status: 'SUCCESS',
  },
  {
    eventId: makeHash('event_002'),
    eventType: 'ROOT_REGISTERED',
    timestamp: baseTime + 1000,
    actorRid: studentRid,
    eventHash: makeHash('event_002_hash'),
    prevCommitment: makeHash('commit_001'),
    currentCommitment: makeHash('commit_002'),
    details: 'Student identity registered',
    status: 'SUCCESS',
  },
  {
    eventId: makeHash('event_003'),
    eventType: 'RELATIONSHIP_CREATED',
    timestamp: baseTime + 5000,
    actorRid: univRid,
    eventHash: makeHash('event_003_hash'),
    prevCommitment: makeHash('commit_002'),
    currentCommitment: makeHash('commit_003'),
    details: 'ACADEMIC_CREDENTIAL relationship created: University → Student',
    status: 'SUCCESS',
  },
  {
    eventId: makeHash('event_004'),
    eventType: 'PROOF_VERIFIED',
    timestamp: baseTime + 10000,
    actorRid: employerRid,
    eventHash: makeHash('event_004_hash'),
    prevCommitment: makeHash('commit_003'),
    currentCommitment: makeHash('commit_004'),
    details: 'Proof envelope verified by TechCorp India',
    status: 'SUCCESS',
  },
  {
    eventId: makeHash('event_005'),
    eventType: 'STATE_COMMITTED',
    timestamp: baseTime + 10100,
    actorRid: univRid,
    eventHash: makeHash('event_005_hash'),
    prevCommitment: makeHash('commit_004'),
    currentCommitment: makeHash('commit_005'),
    details: 'State transition committed to Merkle tree. Seq: 2',
    status: 'SUCCESS',
  },
  {
    eventId: makeHash('event_006'),
    eventType: 'VERIFICATION_REQUESTED',
    timestamp: baseTime + 3600000,
    actorRid: employerRid,
    eventHash: makeHash('event_006_hash'),
    prevCommitment: makeHash('commit_005'),
    currentCommitment: makeHash('commit_006'),
    details: 'Verification requested for enrollment credential',
    status: 'SUCCESS',
  },
  {
    eventId: makeHash('event_007'),
    eventType: 'VERIFICATION_ACCEPTED',
    timestamp: baseTime + 3600740,
    actorRid: employerRid,
    eventHash: makeHash('event_007_hash'),
    prevCommitment: makeHash('commit_006'),
    currentCommitment: makeHash('commit_007'),
    details: 'Verification accepted. Latency: 0.74ms',
    status: 'SUCCESS',
  },
  {
    eventId: makeHash('event_008'),
    eventType: 'REPLAY_DETECTED',
    timestamp: baseTime + 3700000,
    actorRid: employerRid,
    eventHash: makeHash('event_008_hash'),
    prevCommitment: makeHash('commit_007'),
    currentCommitment: makeHash('commit_007'), // unchanged on rejection
    details: 'Replay attack detected. Nonce already in cache. State unchanged.',
    status: 'FAILURE',
  },
];
