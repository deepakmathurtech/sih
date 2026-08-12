import React, { useState } from 'react';
import { FileKey, CheckCircle, XCircle, Clock, Shield, RotateCcw, AlertTriangle } from 'lucide-react';
import { DEMO_SCENARIOS, replayEnvelope } from '../data/mockCredentials';
import { verifyEnvelopeSignatures, parseProofEnvelope } from '../protocol/proofEnvelope';
import { checkReplay, checkTimestampWindow, NonceCache } from '../protocol/replayProtection';
import { createInitialState } from '../protocol/stateRuntime';
import { verifyAuthorizationScope } from '../protocol/proofEnvelope';
import type { ProofEnvelope } from '../types';
import ProofViewer from '../components/common/ProofViewer';
import StatusBadge from '../components/common/StatusBadge';

const ALLOWED_SCOPES = ['VERIFY_ENROLLMENT', 'REL_ISSUE:EMPLOYMENT'];

interface ActionResult {
  label: string;
  passed: boolean;
  details: string;
}

export default function ProofEnvelopePage() {
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState(0);
  const [actionResults, setActionResults] = useState<ActionResult[]>([]);
  const [replayState, setReplayState] = useState<{ cache: NonceCache; poisoned: boolean }>({
    cache: new NonceCache(), poisoned: false
  });

  const scenario = DEMO_SCENARIOS[selectedScenarioIdx];
  const envelope: ProofEnvelope = scenario.credential.proofEnvelope;
  const state = createInitialState();

  const handleVerifySignature = () => {
    const { issuerValid, subjectValid } = verifyEnvelopeSignatures(envelope, state);
    setActionResults(prev => [{
      label: 'Signature Verification',
      passed: issuerValid && subjectValid,
      details: issuerValid && subjectValid
        ? `Issuer signature VALID ✓ • Holder co-signature VALID ✓\nAlgorithm: ECDSA P-256 (demo Ed25519 equivalent)\nCanonical hash matches`
        : `Issuer signature: ${issuerValid ? 'VALID' : 'INVALID ✗'}\nHolder signature: ${subjectValid ? 'VALID' : 'INVALID ✗'}\nError: ERR_SIGNATURE_INVALID`
    }, ...prev]);
  };

  const handleVerifyTimestamp = () => {
    const result = checkTimestampWindow(envelope.timestamp);
    const skewSec = (result.skewMs / 1000).toFixed(1);
    setActionResults(prev => [{
      label: 'Timestamp Window Check',
      passed: result.valid,
      details: result.valid
        ? `Timestamp: ${new Date(envelope.timestamp).toLocaleTimeString()}\nCurrent: ${new Date().toLocaleTimeString()}\nSkew: ${skewSec}s\nWindow: ${result.windowSeconds}s\nResult: VALID (within window)`
        : `Timestamp: ${new Date(envelope.timestamp).toLocaleTimeString()}\nCurrent: ${new Date().toLocaleTimeString()}\nSkew: ${skewSec}s — EXCEEDS ${result.windowSeconds}s window\nError: ERR_REPLAY_DETECTED`
    }, ...prev]);
  };

  const handleCheckReplay = () => {
    const result = checkReplay(envelope.nonce, envelope.timestamp, replayState.cache);
    setActionResults(prev => [{
      label: 'Replay Check (Nonce Cache)',
      passed: result.passed,
      details: result.passed
        ? `Nonce: ${envelope.nonce.substring(0, 16)}...\nStatus: NOT SEEN — nonce not in cache\nResult: PASSED`
        : `Nonce: ${envelope.nonce.substring(0, 16)}...\nStatus: ALREADY SEEN in nonce cache\nReason: ${result.reason}\nError: ERR_REPLAY_DETECTED`
    }, ...prev]);
  };

  const handleReplayProof = () => {
    // First submission — add nonce to cache
    replayState.cache.add(envelope.nonce, envelope.timestamp, envelope.envelopeId);
    setReplayState({ ...replayState, poisoned: true });

    // Second check — should fail
    const result = checkReplay(envelope.nonce, envelope.timestamp, replayState.cache);
    setActionResults(prev => [{
      label: '🔄 REPLAY PROOF SUBMITTED',
      passed: false,
      details: `Nonce: ${envelope.nonce.substring(0, 16)}...\n\nFirst submission: ACCEPTED — nonce added to cache\nSecond submission: REJECTED\n\nReason: ${result.reason}\nError: ERR_REPLAY_DETECTED\n\nThe state machine remains UNCHANGED.`
    }, ...prev]);
  };

  const handleCheckScope = () => {
    const result = verifyAuthorizationScope(envelope.relationship.scope, ALLOWED_SCOPES);
    setActionResults(prev => [{
      label: 'Authorization Scope Check',
      passed: result.valid,
      details: result.valid
        ? `Scope: ${envelope.relationship.scope}\nAllowed: [${ALLOWED_SCOPES.join(', ')}]\nResult: AUTHORIZED`
        : `Scope: ${envelope.relationship.scope}\n${result.reason}`
    }, ...prev]);
  };

  const handleEvaluateState = () => {
    const { issuerValid } = verifyEnvelopeSignatures(envelope, state);
    const tsCheck = checkTimestampWindow(envelope.timestamp);
    const nonceOk = !replayState.cache.has(envelope.nonce);
    const allOk = issuerValid && tsCheck.valid && nonceOk;

    setActionResults(prev => [{
      label: 'Full State Evaluation',
      passed: allOk,
      details: allOk
        ? `All checks PASSED:\n✓ Signature valid\n✓ Timestamp in window\n✓ Nonce not replayed\n\nState transition: ACCEPTED\nσ' = f(σ, m) → ACTIVE`
        : `One or more checks FAILED:\n${issuerValid ? '✓' : '✗'} Signature valid\n${tsCheck.valid ? '✓' : '✗'} Timestamp in window\n${nonceOk ? '✓' : '✗'} Nonce not replayed\n\nState: UNCHANGED`
    }, ...prev]);
  };

  // Build display-safe envelope (truncate long values)
  const displayEnvelope = {
    protocol: envelope.protocol,
    version: envelope.version,
    envelopeId: envelope.envelopeId.substring(0, 40) + '...',
    ridIssuer: envelope.ridIssuer.substring(0, 40) + '...',
    ridSubject: envelope.ridSubject.substring(0, 40) + '...',
    relationship: envelope.relationship,
    nonce: envelope.nonce,
    timestamp: envelope.timestamp,
    ttl: envelope.ttl,
    signatureIssuer: (envelope.signatureIssuer ?? '').substring(0, 48) + '...',
    signatureSubject: (envelope.signatureSubject ?? '').substring(0, 48) + '...',
    ...(envelope.delegationProof ? { delegationProof: { depth: envelope.delegationProof.depth, maxDepth: envelope.delegationProof.maxDepth } } : {}),
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <FileKey size={20} className="text-teal-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Proof Envelope Inspector</h1>
          <p className="text-xs text-slate-500">Inspect and verify cryptographic proof envelopes</p>
        </div>
      </div>

      {/* Scenario selector */}
      <div className="flex gap-2 flex-wrap">
        {DEMO_SCENARIOS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              setSelectedScenarioIdx(i);
              setActionResults([]);
              setReplayState({ cache: new NonceCache(), poisoned: false });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              selectedScenarioIdx === i
                ? 'bg-teal-500/15 border-teal-500/40 text-teal-400'
                : 'border-slate-700/50 text-slate-500 hover:border-slate-600 hover:text-slate-300'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* JSON Viewer */}
        <div className="space-y-4">
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800/50 flex items-center justify-between">
              <div className="text-xs font-semibold text-white">Proof Envelope</div>
              <StatusBadge status={scenario.expectedOutcome} />
            </div>
            <div className="p-5">
              <ProofViewer data={displayEnvelope} />
            </div>
          </div>

          {/* Human readable explanation */}
          <div className="glass-card p-5 border border-indigo-500/20">
            <div className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-3">
              Human-Readable Field Explanation
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex gap-2">
                <span className="font-mono text-indigo-300 w-28 flex-shrink-0">ridIssuer:</span>
                <span>Identifies the issuing authority without embedding names or internal database IDs.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-mono text-indigo-300 w-28 flex-shrink-0">ridSubject:</span>
                <span>Identifies the credential holder (student/person) via zero-PII Root Identity hash.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-mono text-indigo-300 w-28 flex-shrink-0">nonce:</span>
                <span>Random 128-bit single-use token to prevent replay attack reuse.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-mono text-indigo-300 w-28 flex-shrink-0">timestamp:</span>
                <span>Submission timestamp evaluated against server sliding window (300 seconds).</span>
              </div>
              <div className="flex gap-2">
                <span className="font-mono text-indigo-300 w-28 flex-shrink-0">signatures:</span>
                <span>Dual co-signatures over RFC 8785 canonical JSON payload.</span>
              </div>
            </div>
          </div>

          {/* Replay demo */}
          <div className="glass-card p-5 border border-amber-500/15">
            <div className="text-[10px] uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
              <AlertTriangle size={12} />
              Replay Attack Demonstration
            </div>
            <div className="space-y-2 text-xs text-slate-400 mb-4">
              <div className="flex gap-3 items-center">
                <div className="font-mono text-[10px]">Nonce: <span className="text-teal-300">{envelope.nonce.substring(0, 20)}...</span></div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="font-mono text-[10px]">Timestamp: <span className="text-teal-300">{new Date(envelope.timestamp).toLocaleTimeString()}</span></div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="font-mono text-[10px]">Window: <span className="text-blue-300">300 seconds</span></div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="font-mono text-[10px]">Cache size: <span className="text-amber-300">{replayState.cache.size()} entries</span></div>
              </div>
            </div>
            <button
              onClick={handleReplayProof}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/15 transition-all"
            >
              <RotateCcw size={13} />
              Replay Proof (Submit Again)
            </button>
          </div>
        </div>

        {/* Action buttons + results */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-4">Verification Actions</div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: 'Verify Signature', fn: handleVerifySignature, icon: Shield, color: 'teal' },
                { label: 'Verify Timestamp', fn: handleVerifyTimestamp, icon: Clock, color: 'blue' },
                { label: 'Check Replay (Nonce)', fn: handleCheckReplay, icon: RotateCcw, color: 'yellow' },
                { label: 'Check Scope', fn: handleCheckScope, icon: FileKey, color: 'indigo' },
                { label: 'Evaluate Full State', fn: handleEvaluateState, icon: CheckCircle, color: 'emerald' },
              ].map(({ label, fn, icon: Icon, color }) => (
                <button
                  key={label}
                  onClick={fn}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-all
                    border-${color}-500/20 text-${color}-400 bg-${color}-500/5 hover:bg-${color}-500/10`}
                  style={{
                    borderColor: `rgb(var(--${color}-500) / 0.25)`,
                    color: `rgb(var(--${color}-400))`,
                    backgroundColor: `rgb(var(--${color}-500) / 0.06)`,
                  }}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {actionResults.length > 0 && (
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-widest text-slate-500">Results</div>
              {actionResults.slice(0, 5).map((r, i) => (
                <div
                  key={i}
                  className={`glass-card p-4 border ${r.passed ? 'border-emerald-500/25' : 'border-red-500/25'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {r.passed
                      ? <CheckCircle size={14} className="text-emerald-400" />
                      : <XCircle size={14} className="text-red-400" />
                    }
                    <span className={`text-xs font-semibold ${r.passed ? 'text-emerald-300' : 'text-red-300'}`}>
                      {r.passed ? 'PASS' : 'REJECTED'}: {r.label}
                    </span>
                  </div>
                  <pre className="text-[10px] font-mono text-slate-400 whitespace-pre-wrap leading-relaxed">{r.details}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
