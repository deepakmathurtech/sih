// ============================================================
// RIDTP Core Type Definitions
// Root Identity Distribution and Transfer Protocol
// ============================================================

export type RIDString = string; // urn:ridtp:root:sha256:<hex>
export type RRIDString = string; // urn:ridtp:rel:sha256:<hex>
export type EnvIDString = string; // urn:ridtp:env:sha256:<hex>

export type EntityType = 'ORGANIZATION' | 'INDIVIDUAL' | 'SERVICE';
export type ProtocolStatus = 'UNREGISTERED' | 'REGISTERED' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
export type RelationshipType = 'ACADEMIC_CREDENTIAL' | 'EMPLOYMENT' | 'FINANCIAL' | 'GOVERNMENT_ID' | 'MEMBERSHIP';
export type VerificationOutcome = 'VERIFIED' | 'REJECTED' | 'PENDING' | 'EXPIRED';
export type StageStatus = 'pending' | 'running' | 'pass' | 'fail' | 'skipped';

// ─── Root Identity ────────────────────────────────────────────────────────────
export interface RootIdentity {
  rid: RIDString;
  publicKeyHex: string;
  entityType: EntityType;
  entityLabel: string;
  status: ProtocolStatus;
  registeredAt: number; // unix timestamp ms
  merkleLeaf?: string;
}

// ─── Relationship Object ──────────────────────────────────────────────────────
export interface RelationshipObject {
  rrid: RRIDString;
  issuerRid: RIDString;
  subjectRid: RIDString;
  type: RelationshipType;
  scope: string; // e.g. "VERIFY_ENROLLMENT"
  nonce: string;
  timestamp: number;
  ttl: number; // seconds
  issuerSignature: string;
  subjectSignature: string;
  status: ProtocolStatus;
  expiresAt: number; // unix timestamp ms
  metadata?: Record<string, string>;
}

// ─── Delegation Proof ─────────────────────────────────────────────────────────
export interface DelegationProof {
  delegationId: string;
  delegatorRid: RIDString;
  delegateRid: RIDString;
  allowedScopes: string[];
  validUntil: number;
  depth: number; // 1-based, max 3
  maxDepth: number; // always 3
  delegatorSignature: string;
}

// ─── Proof Envelope ───────────────────────────────────────────────────────────
export interface ProofEnvelope {
  envelopeId: EnvIDString;
  protocol: 'RIDTP';
  version: '1.0';
  ridIssuer: RIDString;
  ridSubject: RIDString;
  relationship: {
    type: RelationshipType;
    scope: string;
    rrid: RRIDString;
  };
  nonce: string;
  timestamp: number;
  ttl: number;
  signatureIssuer: string;
  signatureSubject: string;
  delegationProof?: DelegationProof;
  canonicalHash?: string;
}

// ─── State Transition ─────────────────────────────────────────────────────────
export interface StateTransition {
  id: string;
  fromState: ProtocolStatus;
  toState: ProtocolStatus;
  trigger: string;
  timestamp: number;
  actorRid: RIDString;
  merkleRootBefore: string;
  merkleRootAfter: string;
}

// ─── Audit Event ──────────────────────────────────────────────────────────────
export type AuditEventType =
  | 'RELATIONSHIP_CREATED'
  | 'PROOF_VERIFIED'
  | 'PROOF_REJECTED'
  | 'STATE_COMMITTED'
  | 'VERIFICATION_REQUESTED'
  | 'VERIFICATION_ACCEPTED'
  | 'VERIFICATION_REJECTED'
  | 'RELATIONSHIP_REVOKED'
  | 'DELEGATION_ISSUED'
  | 'DELEGATION_REJECTED'
  | 'REPLAY_DETECTED'
  | 'ROOT_REGISTERED';

export interface AuditEvent {
  eventId: string;
  eventType: AuditEventType;
  timestamp: number;
  actorRid: RIDString;
  eventHash: string;
  prevCommitment: string;
  currentCommitment: string;
  details: string;
  status: 'SUCCESS' | 'FAILURE';
}

// ─── Verification Stage ───────────────────────────────────────────────────────
export interface VerificationStage {
  id: string;
  stepNumber: number;
  name: string;
  description: string;
  status: StageStatus;
  latencyMs: number;
  details: Record<string, string | boolean | number>;
  errorCode?: string;
  technicalInfo?: string;
}

// ─── Verification Result ──────────────────────────────────────────────────────
export interface VerificationResult {
  id: string;
  outcome: VerificationOutcome;
  stages: VerificationStage[];
  totalLatencyMs: number;
  timestamp: number;
  issuerLabel: string;
  subjectLabel: string;
  issuerRid: RIDString;
  subjectRid: RIDString;
  relationshipStatus: ProtocolStatus;
  proofStatus: 'VALID' | 'INVALID' | 'EXPIRED';
  issuerAttestationValid: boolean;
  subjectAttestationValid: boolean;
  replayProtectionPassed: boolean;
  authorizationScopeValid: boolean;
  revocationStatus: 'NOT_REVOKED' | 'REVOKED' | 'UNKNOWN';
  stateStatus: ProtocolStatus;
  merkleRoot?: string;
  errorCode?: string;
  errorMessage?: string;
}

// ─── Credential & Document Models ─────────────────────────────────────────────────────────────
export type DocumentStatus = 'NOT_CONNECTED' | 'CONNECTED';

export interface RIDTPCredential {
  id: string;
  type: RelationshipType;
  issuerName: string;
  subjectName: string;
  issuerRid: RIDString;
  subjectRid: RIDString;
  proofEnvelope: ProofEnvelope;
  relationship: RelationshipObject;
  isDemo: boolean;
  demoLabel?: string;
  // Document metadata extension
  documentTitle?: string;
  issueDate?: number;
  expiryDate?: number;
  credentialReference?: string;
  documentStatus?: DocumentStatus;
}

// ─── Demo Scenario ────────────────────────────────────────────────────────────
export type ScenarioType =
  | 'valid'
  | 'tampered'
  | 'replay'
  | 'revoked'
  | 'expired'
  | 'delegation_exceeded';

export interface DemoScenario {
  id: ScenarioType;
  name: string;
  description: string;
  badge: string;
  badgeColor: string;
  credential: RIDTPCredential;
  expectedOutcome: VerificationOutcome;
  expectedErrorCode?: string;
}

// ─── Protocol State (Internal) ────────────────────────────────────────────────
export interface ProtocolState {
  rootRegistry: Map<RIDString, RootIdentity>;
  relationshipRegistry: Map<RRIDString, RelationshipObject>;
  merkleRoot: string;
  sequenceNumber: number;
}

// ─── Nonce Cache ──────────────────────────────────────────────────────────────
export interface NonceCacheEntry {
  nonce: string;
  timestamp: number;
  envelopeId: string;
}

// ─── Test Result ──────────────────────────────────────────────────────────────
export interface TestResult {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'running';
  latencyMs: number;
  error?: string;
}
