import React, { useState } from 'react';
import { ScrollText, Link as LinkIcon, CheckCircle, XCircle, ArrowDown } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { simulateStateTransition, type StateMessage } from '../protocol/stateRuntime';
import StatusBadge from '../components/common/StatusBadge';

export default function AuditLogPage() {
  const { state } = useAppStore();
  const { auditLog, merkleRoot } = state;
  const [selectedMessage, setSelectedMessage] = useState<StateMessage>('VALID_PROOF');
  const [viewMode, setViewMode] = useState<'technical' | 'plain'>('plain');

  const transitionDemo = simulateStateTransition(merkleRoot, selectedMessage, state.protocolState.sequenceNumber + 1);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <ScrollText size={20} className="text-teal-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Audit Log & State Runtime</h1>
          <p className="text-xs text-slate-500">Append-only cryptographic state commitments and deterministic transitions</p>
        </div>
      </div>

      {/* Deterministic State Runtime Visualization */}
      <div className="glass-card p-6 border border-indigo-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
            Interactive State Runtime Visualization
          </div>
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[10px]">
            <button
              onClick={() => setViewMode('plain')}
              className={`px-2.5 py-1 rounded transition-all ${viewMode === 'plain' ? 'bg-indigo-500/20 text-indigo-300 font-semibold' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Plain-Language View
            </button>
            <button
              onClick={() => setViewMode('technical')}
              className={`px-2.5 py-1 rounded transition-all ${viewMode === 'technical' ? 'bg-indigo-500/20 text-indigo-300 font-semibold' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Technical View [σ' = f(σ, m)]
            </button>
          </div>
        </div>

        {viewMode === 'plain' && (
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <strong>Concept Explanation:</strong> The runtime evaluates the incoming proof envelope against the current active identity relationship state. If all signature, timestamp, nonce, scope, and revocation checks pass, the system deterministically advances to the next state.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Current State */}
          <div className="glass-card-light p-4 text-center border border-slate-700/40">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Current State σ</div>
            <div className="text-sm font-mono text-indigo-300 font-bold">ACTIVE</div>
            <div className="text-[10px] font-mono text-slate-500 mt-2 truncate">
              Root: {merkleRoot.substring(0, 16)}...
            </div>
          </div>

          {/* Transition Selector */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">+ Message m</div>
            <select
              value={selectedMessage}
              onChange={e => setSelectedMessage(e.target.value as StateMessage)}
              className="w-full bg-slate-900 border border-teal-500/30 text-teal-300 text-xs font-mono rounded-lg px-3 py-2 outline-none cursor-pointer"
            >
              <option value="VALID_PROOF">valid_proof</option>
              <option value="INVALID_SIGNATURE">invalid_signature</option>
              <option value="EXPIRED_PROOF">expired_proof</option>
              <option value="REPLAYED_PROOF">replayed_proof</option>
              <option value="UNAUTHORIZED_SCOPE">unauthorized_scope</option>
              <option value="REVOKED_RELATIONSHIP">revoked_relationship</option>
            </select>
            <div className="text-slate-600 text-sm">↓ f(σ, m)</div>
          </div>

          {/* Next State */}
          <div className={`glass-card-light p-4 text-center border ${
            transitionDemo.outcome === 'ACCEPTED' ? 'border-emerald-500/40' : 'border-red-500/40'
          }`}>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Next State σ'</div>
            <div className={`text-sm font-mono font-bold ${
              transitionDemo.outcome === 'ACCEPTED' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {transitionDemo.toState}
            </div>
            {transitionDemo.newMerkleRoot && (
              <div className="text-[10px] font-mono text-emerald-300/80 mt-2 truncate">
                New: {transitionDemo.newMerkleRoot.substring(0, 16)}...
              </div>
            )}
            {transitionDemo.reason && (
              <div className="text-[9px] font-mono text-red-400/80 mt-1">
                {transitionDemo.reason}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Append-only Event Chain */}
      <div className="space-y-3">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 px-1">
          Cryptographic Event Ledger ({auditLog.length} events)
        </div>

        <div className="space-y-3 relative">
          {auditLog.slice().reverse().map((event, idx) => (
            <div key={event.eventId} className="glass-card p-4 relative group hover:border-slate-600 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {event.status === 'SUCCESS' ? (
                    <CheckCircle size={16} className="text-emerald-400" />
                  ) : (
                    <XCircle size={16} className="text-red-400" />
                  )}
                  <span className="font-mono text-xs font-bold text-slate-200">{event.eventType}</span>
                  <StatusBadge status={event.status} size="sm" />
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-3">{event.details}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                <div>
                  <span className="text-slate-600">Event Hash: </span>
                  <span className="text-indigo-300">{event.eventHash.substring(0, 12)}...</span>
                </div>
                <div>
                  <span className="text-slate-600">Prev Commitment: </span>
                  <span className="text-slate-400">{event.prevCommitment.substring(0, 12)}...</span>
                </div>
                <div>
                  <span className="text-slate-600">New Commitment: </span>
                  <span className="text-teal-300">{event.currentCommitment.substring(0, 12)}...</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
