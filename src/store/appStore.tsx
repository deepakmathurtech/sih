// ============================================================
// RIDTP App Store — Global State Management
// React Context + useReducer
// ============================================================

import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type {
  ProtocolState, VerificationResult, AuditEvent, DemoScenario, ScenarioType, RIDTPCredential
} from '../types';
import { NonceCache } from '../protocol/replayProtection';
import { createInitialState } from '../protocol/stateRuntime';
import { MOCK_IDENTITIES } from '../data/mockIdentities';
import { INITIAL_AUDIT_LOG } from '../data/mockAuditLog';
import { DEMO_SCENARIOS, revocableRelationship, replayEnvelope, replayRelationship } from '../data/mockCredentials';
import { registerRelationship } from '../protocol/relationship';
import { sha256Sync } from '../crypto';

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AppState {
  theme: 'dark' | 'light';
  demoMode: boolean;
  activeScenario: ScenarioType | null;
  protocolState: ProtocolState;
  nonceCache: NonceCache;
  verificationHistory: VerificationResult[];
  auditLog: AuditEvent[];
  merkleRoot: string;
  credentials: RIDTPCredential[];
  stats: {
    total: number;
    verified: number;
    rejected: number;
    revoked: number;
    expired: number;
  };
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type AppAction =
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_DEMO_MODE'; payload: boolean }
  | { type: 'SET_SCENARIO'; payload: ScenarioType }
  | { type: 'ADD_VERIFICATION_RESULT'; payload: VerificationResult }
  | { type: 'ADD_AUDIT_EVENT'; payload: AuditEvent }
  | { type: 'REVOKE_RELATIONSHIP'; payload: string } // rrid
  | { type: 'UPDATE_PROTOCOL_STATE'; payload: ProtocolState }
  | { type: 'POISON_NONCE'; payload: { nonce: string; timestamp: number; envelopeId: string } }
  | { type: 'ADD_CREDENTIAL'; payload: RIDTPCredential }
  | { type: 'RESET_SCENARIO' };

// ─── Initial State ────────────────────────────────────────────────────────────

function buildInitialProtocolState(): ProtocolState {
  let state = createInitialState();

  // Register all identities
  for (const identity of Object.values(MOCK_IDENTITIES)) {
    state = {
      ...state,
      rootRegistry: new Map(state.rootRegistry).set(identity.rid, identity),
    };
  }

  // Register all relationships from mock credentials
  for (const scenario of DEMO_SCENARIOS) {
    state = registerRelationship(scenario.credential.relationship, state);
  }

  return state;
}

// Initial state with pre-seeded data
const initialNonceCache = new NonceCache();

function createInitialAppState(): AppState {
  const protocolState = buildInitialProtocolState();
  const initialCredentials = DEMO_SCENARIOS.map(s => ({
    ...s.credential,
    documentStatus: 'CONNECTED' as const,
    documentTitle: s.credential.type === 'ACADEMIC_CREDENTIAL' ? 'B.Tech Computer Science Degree' : s.name,
    issueDate: Date.now() - 180 * 24 * 3600 * 1000,
    expiryDate: Date.now() + 365 * 24 * 3600 * 1000,
    credentialReference: `CRED-${s.credential.id.substring(0, 6).toUpperCase()}`,
  }));

  return {
    theme: 'dark',
    demoMode: true,
    activeScenario: null,
    protocolState,
    nonceCache: initialNonceCache,
    verificationHistory: [],
    auditLog: INITIAL_AUDIT_LOG,
    merkleRoot: protocolState.merkleRoot,
    credentials: initialCredentials,
    stats: {
      total: 1284,
      verified: 1201,
      rejected: 43,
      revoked: 21,
      expired: 19,
    },
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };

    case 'SET_DEMO_MODE':
      return { ...state, demoMode: action.payload };

    case 'SET_SCENARIO': {
      return { ...state, activeScenario: action.payload };
    }

    case 'ADD_CREDENTIAL': {
      const newCred = action.payload;
      // Also register relationship into state if active
      let newProtocolState = state.protocolState;
      newProtocolState = registerRelationship(newCred.relationship, newProtocolState);

      // Audit event
      const auditEvent: AuditEvent = {
        eventId: sha256Sync(`create_doc:${newCred.id}:${Date.now()}`).substring(0, 16),
        eventType: 'RELATIONSHIP_CREATED',
        timestamp: Date.now(),
        actorRid: newCred.issuerRid,
        eventHash: sha256Sync(`doc_hash:${newCred.id}`).substring(0, 32),
        prevCommitment: state.merkleRoot.substring(0, 32),
        currentCommitment: sha256Sync(state.merkleRoot + ':doc:' + newCred.id).substring(0, 32),
        details: `Document '${newCred.documentTitle ?? newCred.type}' connected to RIDTP: ${newCred.issuerName} → ${newCred.subjectName}`,
        status: 'SUCCESS',
      };

      return {
        ...state,
        credentials: [newCred, ...state.credentials],
        protocolState: newProtocolState,
        auditLog: [...state.auditLog, auditEvent],
      };
    }

    case 'ADD_VERIFICATION_RESULT': {
      const r = action.payload;
      const isVerified = r.outcome === 'VERIFIED';
      const isRevoked = r.revocationStatus === 'REVOKED';
      const isExpired = r.proofStatus === 'EXPIRED';

      return {
        ...state,
        verificationHistory: [r, ...state.verificationHistory].slice(0, 50),
        stats: {
          ...state.stats,
          total: state.stats.total + 1,
          verified: state.stats.verified + (isVerified ? 1 : 0),
          rejected: state.stats.rejected + (!isVerified && !isRevoked && !isExpired ? 1 : 0),
          revoked: state.stats.revoked + (isRevoked ? 1 : 0),
          expired: state.stats.expired + (isExpired ? 1 : 0),
        },
      };
    }

    case 'ADD_AUDIT_EVENT':
      return { ...state, auditLog: [...state.auditLog, action.payload] };

    case 'REVOKE_RELATIONSHIP': {
      const rrid = action.payload;
      const rel = state.protocolState.relationshipRegistry.get(rrid);
      if (!rel) return state;
      const newRegistry = new Map(state.protocolState.relationshipRegistry);
      newRegistry.set(rrid, { ...rel, status: 'REVOKED' });
      const newProtocolState = { ...state.protocolState, relationshipRegistry: newRegistry };

      // Add audit event
      const auditEvent: AuditEvent = {
        eventId: sha256Sync(`revoke:${rrid}:${Date.now()}`).substring(0, 16),
        eventType: 'RELATIONSHIP_REVOKED',
        timestamp: Date.now(),
        actorRid: rel.issuerRid,
        eventHash: sha256Sync(`revoke_hash:${rrid}`).substring(0, 32),
        prevCommitment: state.merkleRoot.substring(0, 32),
        currentCommitment: sha256Sync(state.merkleRoot + ':revoke:' + rrid).substring(0, 32),
        details: `Relationship ${rrid.substring(0, 20)}... revoked by issuer`,
        status: 'SUCCESS',
      };

      return {
        ...state,
        protocolState: newProtocolState,
        auditLog: [...state.auditLog, auditEvent],
      };
    }

    case 'UPDATE_PROTOCOL_STATE':
      return {
        ...state,
        protocolState: action.payload,
        merkleRoot: action.payload.merkleRoot,
      };

    case 'POISON_NONCE': {
      // Add nonce to cache to simulate replay scenario
      state.nonceCache.add(
        action.payload.nonce,
        action.payload.timestamp,
        action.payload.envelopeId
      );
      return { ...state };
    }

    case 'RESET_SCENARIO': {
      // Clear nonce cache and rebuild state
      const newCache = new NonceCache();
      const newProtocolState = buildInitialProtocolState();
      return {
        ...state,
        nonceCache: newCache,
        protocolState: newProtocolState,
        merkleRoot: newProtocolState.merkleRoot,
        activeScenario: null,
      };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  activateScenario: (id: ScenarioType) => void;
  resetScenario: () => void;
  addVerificationResult: (result: VerificationResult, newState: ProtocolState) => void;
  revokeRelationship: (rrid: string) => void;
  poisonNonce: (nonce: string, timestamp: number, envelopeId: string) => void;
  addCredential: (credential: RIDTPCredential) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialAppState);

  const activateScenario = useCallback((id: ScenarioType) => {
    // Reset state first
    dispatch({ type: 'RESET_SCENARIO' });
    dispatch({ type: 'SET_SCENARIO', payload: id });

    // For replay scenario: pre-poison the nonce
    if (id === 'replay') {
      dispatch({
        type: 'POISON_NONCE',
        payload: {
          nonce: replayEnvelope.nonce,
          timestamp: replayEnvelope.timestamp,
          envelopeId: replayEnvelope.envelopeId,
        },
      });
    }

    // For revoked scenario: revoke the relationship
    if (id === 'revoked') {
      dispatch({ type: 'REVOKE_RELATIONSHIP', payload: revocableRelationship.rrid });
    }
  }, []);

  const resetScenario = useCallback(() => {
    dispatch({ type: 'RESET_SCENARIO' });
  }, []);

  const addVerificationResult = useCallback((result: VerificationResult, newProtocolState: ProtocolState) => {
    dispatch({ type: 'ADD_VERIFICATION_RESULT', payload: result });
    dispatch({ type: 'UPDATE_PROTOCOL_STATE', payload: newProtocolState });

    // Add audit events
    const auditEvent: AuditEvent = {
      eventId: sha256Sync(`audit:${result.id}:${Date.now()}`).substring(0, 16),
      eventType: result.outcome === 'VERIFIED' ? 'VERIFICATION_ACCEPTED' : 'VERIFICATION_REJECTED',
      timestamp: Date.now(),
      actorRid: result.issuerRid,
      eventHash: sha256Sync(`audit_hash:${result.id}`).substring(0, 32),
      prevCommitment: (result.merkleRoot ?? '').substring(0, 32),
      currentCommitment: sha256Sync(result.merkleRoot + ':' + result.id).substring(0, 32),
      details: `Verification ${result.outcome} for ${result.issuerLabel} → ${result.subjectLabel}. Latency: ${result.totalLatencyMs.toFixed(2)}ms`,
      status: result.outcome === 'VERIFIED' ? 'SUCCESS' : 'FAILURE',
    };
    dispatch({ type: 'ADD_AUDIT_EVENT', payload: auditEvent });
  }, []);

  const revokeRelationshipFn = useCallback((rrid: string) => {
    dispatch({ type: 'REVOKE_RELATIONSHIP', payload: rrid });
  }, []);

  const poisonNonce = useCallback((nonce: string, timestamp: number, envelopeId: string) => {
    dispatch({ type: 'POISON_NONCE', payload: { nonce, timestamp, envelopeId } });
  }, []);

  const addCredentialFn = useCallback((credential: RIDTPCredential) => {
    dispatch({ type: 'ADD_CREDENTIAL', payload: credential });
  }, []);

  return (
    <AppContext.Provider value={{
      state, dispatch,
      activateScenario, resetScenario,
      addVerificationResult,
      revokeRelationship: revokeRelationshipFn,
      poisonNonce,
      addCredential: addCredentialFn,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}
