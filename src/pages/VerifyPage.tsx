import React, { useState, useCallback } from 'react';
import {
  Shield, Upload, QrCode, ClipboardPaste, Hash, FlaskConical,
  Play, CheckCircle, XCircle, AlertTriangle, Clock, ArrowRight,
  RotateCcw, ChevronDown
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { DEMO_SCENARIOS } from '../data/mockCredentials';
import { verifyCredential } from '../protocol/verifier';
import type { RIDTPCredential, VerificationResult, ScenarioType, DemoScenario } from '../types';
import StageCard from '../components/common/StageCard';
import StatusBadge from '../components/common/StatusBadge';
import RIDDisplay from '../components/common/RIDDisplay';

type InputMethod = 'upload' | 'qr' | 'paste' | 'id' | 'demo';

const INPUT_METHODS = [
  { id: 'upload' as InputMethod, icon: Upload, label: 'Upload' },
  { id: 'qr' as InputMethod, icon: QrCode, label: 'Scan QR' },
  { id: 'paste' as InputMethod, icon: ClipboardPaste, label: 'Paste Envelope' },
  { id: 'id' as InputMethod, icon: Hash, label: 'Credential ID' },
  { id: 'demo' as InputMethod, icon: FlaskConical, label: 'Demo Scenario' },
];

const SCENARIO_COLORS: Record<string, string> = {
  emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
  red:     'border-red-500/30 bg-red-500/5 text-red-400',
  orange:  'border-orange-500/30 bg-orange-500/5 text-orange-400',
  yellow:  'border-yellow-500/30 bg-yellow-500/5 text-yellow-400',
};

export default function VerifyPage() {
  const { state, addVerificationResult, activateScenario, dispatch } = useAppStore();
  const [method, setMethod] = useState<InputMethod>('demo');
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>(DEMO_SCENARIOS[0]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [activeStageIdx, setActiveStageIdx] = useState(-1);
  const [liveStages, setLiveStages] = useState<VerificationResult['stages']>([]);
  const [dragOver, setDragOver] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [credId, setCredId] = useState('');

  const handleVerify = useCallback(async () => {
    let credential: RIDTPCredential = selectedScenario.credential;

    // Activate scenario (pre-conditions: revoke, poison nonce, etc.)
    activateScenario(selectedScenario.id as ScenarioType);

    // Wait a tick for state to settle
    await new Promise(r => setTimeout(r, 50));

    setIsVerifying(true);
    setResult(null);
    setLiveStages([]);
    setActiveStageIdx(0);

    // Run verification (this modifies state internally via nonceCache + stateRuntime)
    // We need to use the current state from store — snapshot it
    const currentState = state.protocolState;

    // For replay scenario, re-poison after reset
    if (selectedScenario.id === 'replay') {
      state.nonceCache.add(
        selectedScenario.credential.proofEnvelope.nonce,
        selectedScenario.credential.proofEnvelope.timestamp,
        selectedScenario.credential.proofEnvelope.envelopeId
      );
    }

    try {
      const { result: verResult, newState } = await verifyCredential(
        credential, currentState, state.nonceCache
      );

      // Animate stages appearing
      for (let i = 0; i < verResult.stages.length; i++) {
        setActiveStageIdx(i);
        setLiveStages(verResult.stages.slice(0, i + 1));
        await new Promise(r => setTimeout(r, 60));
      }

      setResult(verResult);
      addVerificationResult(verResult, newState);
    } finally {
      setIsVerifying(false);
      setActiveStageIdx(-1);
    }
  }, [selectedScenario, state, activateScenario, addVerificationResult]);

  const handleReset = () => {
    setResult(null);
    setLiveStages([]);
    dispatch({ type: 'RESET_SCENARIO' });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Shield size={20} className="text-teal-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Credential Verification</h1>
          <p className="text-xs text-slate-500">11-stage RIDTP relationship verification pipeline</p>
        </div>
        {result && (
          <button onClick={handleReset} className="ml-auto flex items-center gap-2 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-all">
            <RotateCcw size={12} />
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Panel */}
        <div className="space-y-4">
          {/* Input method tabs */}
          <div className="glass-card p-1 flex gap-1">
            {INPUT_METHODS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setMethod(id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg text-[11px] font-medium transition-all ${
                  method === id
                    ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Input area */}
          <div className="glass-card p-5 min-h-[200px]">
            {method === 'demo' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-500 mb-3">Select a scenario or connected document:</div>
                
                {/* Dynamically created credentials from /documents */}
                {state.credentials.length > DEMO_SCENARIOS.length && (
                  <div className="mb-4 space-y-2">
                    <div className="text-[10px] uppercase tracking-widest text-teal-400 font-bold">User-Created Documents</div>
                    {state.credentials.slice(0, 3).map(cred => (
                      <button
                        key={cred.id}
                        onClick={() => setSelectedScenario({
                          id: 'valid',
                          name: cred.documentTitle ?? cred.type,
                          description: `${cred.issuerName} → ${cred.subjectName} [Connected Document]`,
                          badge: cred.relationship.status === 'REVOKED' ? 'REVOKED' : 'CONNECTED',
                          badgeColor: cred.relationship.status === 'REVOKED' ? 'red' : 'emerald',
                          credential: cred,
                          expectedOutcome: cred.relationship.status === 'REVOKED' ? 'REJECTED' : 'VERIFIED',
                        })}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedScenario.credential.id === cred.id
                            ? 'border-teal-500/40 bg-teal-500/8'
                            : 'border-slate-700/40 hover:border-slate-600/60 bg-slate-900/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-white">{cred.documentTitle ?? cred.type}</span>
                          <StatusBadge status={cred.relationship.status} size="sm" />
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{cred.issuerName} → {cred.subjectName}</div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Preset Demo Scenarios</div>
                {DEMO_SCENARIOS.map(scenario => (
                  <button
                    key={scenario.id}
                    onClick={() => setSelectedScenario(scenario)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedScenario.id === scenario.id
                        ? 'border-teal-500/40 bg-teal-500/8'
                        : 'border-slate-700/40 hover:border-slate-600/60 bg-slate-900/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-200">{scenario.name}</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${SCENARIO_COLORS[scenario.badgeColor] ?? 'text-slate-400 border-slate-700 bg-slate-800'}`}>
                        {scenario.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{scenario.description}</p>
                    {scenario.expectedErrorCode && (
                      <div className="mt-1 text-[10px] font-mono text-red-400/70">{scenario.expectedErrorCode}</div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {method === 'upload' && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={() => setDragOver(false)}
                className={`flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                  dragOver ? 'border-teal-500/60 bg-teal-500/5' : 'border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <Upload size={28} className="text-slate-600 mb-3" />
                <div className="text-sm text-slate-400 font-medium">Drop PDF, PNG or JPG</div>
                <div className="text-xs text-slate-600 mt-1">or click to browse</div>
                <div className="mt-4 px-3 py-1 rounded text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  DEMO: Select any file to simulate upload → use Demo Scenario tab for full pipeline
                </div>
              </div>
            )}

            {method === 'qr' && (
              <div className="flex flex-col items-center justify-center h-48">
                <div className="w-32 h-32 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center mb-3">
                  <QrCode size={40} className="text-slate-600" />
                </div>
                <div className="text-sm text-slate-400">Camera access required</div>
                <div className="mt-3 px-3 py-1 rounded text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  DEMO MODE: Use Demo Scenario tab for full pipeline demonstration
                </div>
              </div>
            )}

            {method === 'paste' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-500">Paste a JSON proof envelope:</div>
                <textarea
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  className="w-full h-40 code-block text-[11px] resize-none outline-none bg-transparent"
                  placeholder='{"protocol":"RIDTP","version":"1.0",...}'
                />
                <div className="text-[10px] text-slate-600">
                  DEMO: Use Demo Scenario tab for live pipeline. Pasted envelopes will be parsed and validated structurally.
                </div>
              </div>
            )}

            {method === 'id' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-500">Enter a Credential ID (RRID):</div>
                <input
                  value={credId}
                  onChange={e => setCredId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-sm font-mono text-slate-200 outline-none focus:border-teal-500/50"
                  placeholder="urn:ridtp:rel:sha256:..."
                />
                <div className="text-[10px] text-slate-600">
                  DEMO: Use Demo Scenario tab for live pipeline demonstration.
                </div>
              </div>
            )}
          </div>

          {/* Credential preview */}
          {method === 'demo' && (
            <div className="glass-card p-5">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Credential Preview</div>
              <div className="text-[10px] bg-amber-500/8 border border-amber-500/20 rounded px-3 py-2 text-amber-400 mb-3">
                ⚠ {selectedScenario.credential.demoLabel}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Type</span>
                  <span className="font-mono text-slate-300">{selectedScenario.credential.type}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Issuer</span>
                  <span className="text-slate-300">{selectedScenario.credential.issuerName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Subject</span>
                  <span className="text-slate-300">{selectedScenario.credential.subjectName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Scope</span>
                  <span className="font-mono text-slate-300">{selectedScenario.credential.relationship.scope}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Expected</span>
                  <StatusBadge status={selectedScenario.expectedOutcome} />
                </div>
              </div>
              <RIDDisplay rid={selectedScenario.credential.issuerRid} label="Issuer RID" className="mt-3" />
            </div>
          )}

          {/* Run button */}
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-sm transition-all ${
              isVerifying
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-500 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-teal-500/20'
            }`}
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Play size={16} />
                Run RIDTP Verification
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        {/* Right: Pipeline + Result */}
        <div className="space-y-4">
          {/* Pipeline stages */}
          {(isVerifying || liveStages.length > 0) && (
            <div className="glass-card p-5">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-4">Verification Pipeline</div>
              <div className="space-y-2">
                {liveStages.map((stage, i) => (
                  <StageCard
                    key={stage.id}
                    stage={stage}
                    isActive={i === activeStageIdx}
                    style={{ animationDelay: `${i * 40}ms` }}
                  />
                ))}
                {isVerifying && activeStageIdx >= 0 && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-700/50 bg-slate-900/30">
                    <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                    <span className="text-sm text-slate-400">Processing...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`glass-card p-6 border ${
              result.outcome === 'VERIFIED' ? 'border-emerald-500/30' : 'border-red-500/30'
            }`}>
              {/* Outcome banner */}
              <div className={`text-center py-6 mb-6 rounded-xl ${
                result.outcome === 'VERIFIED' ? 'bg-emerald-500/8' : 'bg-red-500/8'
              }`}>
                <div className="flex justify-center mb-3">
                  {result.outcome === 'VERIFIED'
                    ? <CheckCircle size={40} className="text-emerald-400 verified-pop" />
                    : <XCircle size={40} className="text-red-400" />
                  }
                </div>
                <div className={`text-3xl font-black font-mono tracking-widest ${
                  result.outcome === 'VERIFIED' ? 'text-emerald-300' : 'text-red-300'
                }`}>
                  {result.outcome}
                </div>
                <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-500">
                  <Clock size={11} />
                  {result.totalLatencyMs.toFixed(2)} ms · Verified locally · {new Date(result.timestamp).toLocaleTimeString()}
                </div>
                {result.errorCode && (
                  <div className="mt-2 font-mono text-xs text-red-400">{result.errorCode}</div>
                )}
                {result.errorMessage && (
                  <div className="mt-1 text-xs text-red-400/70">{result.errorMessage}</div>
                )}
              </div>

              {/* Detail grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { label: 'Credential Relationship', value: `${result.issuerLabel} → ${result.subjectLabel}` },
                  { label: 'Relationship Status', value: result.relationshipStatus, badge: true },
                  { label: 'Proof Status', value: result.proofStatus, badge: true },
                  { label: 'Issuer Attestation', value: result.issuerAttestationValid ? 'VALID' : 'INVALID', badge: true },
                  { label: 'Holder Attestation', value: result.subjectAttestationValid ? 'VALID' : 'INVALID', badge: true },
                  { label: 'Replay Protection', value: result.replayProtectionPassed ? 'PASSED' : 'FAILED', badge: true },
                  { label: 'Authorization Scope', value: result.authorizationScopeValid ? 'VALID' : 'INVALID', badge: true },
                  { label: 'Revocation', value: result.revocationStatus, badge: true },
                ].map(({ label, value, badge }) => (
                  <div key={label} className="glass-card-light p-3">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">{label}</div>
                    {badge ? <StatusBadge status={value} /> : <div className="text-sm text-slate-200 font-medium">{value}</div>}
                  </div>
                ))}
              </div>

              {/* Why was this verified/rejected explanation */}
              <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                  <Shield size={12} className="text-teal-400" />
                  {result.outcome === 'VERIFIED' ? 'Why was this proof verified?' : 'Why was this proof rejected?'}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {result.outcome === 'VERIFIED' ? (
                    'The proof envelope was accepted because the issuer and subject co-signatures matched the canonical payload hash, the timestamp was within the 300s permitted sliding window, the nonce was unique (not replayed), the authorization scope matched delegation rules, and the relationship state remains ACTIVE in the Merkle registry.'
                  ) : (
                    `The proof was rejected due to ${result.errorCode ?? 'verification failure'}. ${result.errorMessage ?? 'One or more protocol invariants failed.'} Protocol Law Enforcement prevented state transition mutation, keeping the active state tree unchanged.`
                  )}
                </p>
                {result.errorCode && (
                  <div className="text-[10px] font-mono text-amber-400/90 pt-1 border-t border-slate-800/60">
                    Security Property: {
                      result.errorCode === 'ERR_SIGNATURE_INVALID' ? 'Protects against identity impersonation and payload forgery.' :
                      result.errorCode === 'ERR_REPLAY_DETECTED' ? 'Protects against message replay and duplicate presentation attacks.' :
                      result.errorCode === 'ERR_PROOF_EXPIRED' ? 'Protects against stale or expired proof submissions.' :
                      result.errorCode === 'ERR_RELATIONSHIP_REVOKED' ? 'Ensures real-time state enforcement over static document representations.' :
                      result.errorCode === 'ERR_SCOPE_UNAUTHORIZED' ? 'Enforces strict delegation limits and bounded authority scope.' :
                      'Enforces deterministic state machine laws.'
                    }
                  </div>
                )}
              </div>

              {/* Merkle root */}
              {result.merkleRoot && (
                <div className="mt-4 pt-4 border-t border-slate-800/50">
                  <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-1">New Merkle Root (σ')</div>
                  <code className="text-[10px] font-mono text-indigo-300/60">{result.merkleRoot}</code>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!result && !isVerifying && (
            <div className="glass-card p-10 text-center">
              <Shield size={32} className="mx-auto text-slate-700 mb-3" />
              <div className="text-slate-500 text-sm">Select a scenario and run verification</div>
              <div className="text-slate-700 text-xs mt-1">11-stage pipeline will animate here</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
