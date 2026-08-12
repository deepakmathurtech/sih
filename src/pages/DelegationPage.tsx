import React, { useState } from 'react';
import { GitBranch, AlertTriangle, CheckCircle, XCircle, Plus } from 'lucide-react';
import { buildDemoDelegationChain, buildDelegationProof, validateDelegationChain, MAX_DELEGATION_DEPTH } from '../protocol/delegation';
import { sha256Sync } from '../crypto';
import { MOCK_IDENTITIES } from '../data/mockIdentities';
import StatusBadge from '../components/common/StatusBadge';
import RIDDisplay from '../components/common/RIDDisplay';

export default function DelegationPage() {
  const { chain, nodes } = buildDemoDelegationChain();
  const [extraDepth, setExtraDepth] = useState(false);
  const [validationResult, setValidationResult] = useState<ReturnType<typeof validateDelegationChain> | null>(null);

  const displayChain = extraDepth ? [
    ...chain,
    buildDelegationProof(
      nodes[3].rid,
      'urn:ridtp:root:sha256:' + sha256Sync('level4_agent_demo'),
      ['VERIFY_ENROLLMENT'],
      3600,
      4 // exceeds max
    )
  ] : chain;

  const displayNodes = extraDepth
    ? [...nodes, { rid: 'urn:ridtp:root:sha256:' + sha256Sync('level4_agent_demo'), label: 'External Agent (L4)', role: 'Level 4 — INVALID' }]
    : nodes;

  const handleValidate = () => {
    const result = validateDelegationChain(displayChain, 'VERIFY_ENROLLMENT');
    setValidationResult(result);
  };

  const colorForNode = (i: number, total: number) => {
    if (extraDepth && i === total - 1) return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', label: 'text-red-300' };
    const colors = [
      { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', label: 'text-indigo-300' },
      { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', label: 'text-blue-300' },
      { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400', label: 'text-teal-300' },
      { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'text-emerald-300' },
    ];
    return colors[Math.min(i, colors.length - 1)];
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <GitBranch size={20} className="text-teal-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Delegation Engine</h1>
          <p className="text-xs text-slate-500">Bounded scoped authority — max depth 3 (LAW 10.2)</p>
        </div>
      </div>

      {/* Law callout */}
      <div className="glass-card p-4 border border-amber-500/20 flex items-start gap-3">
        <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-semibold text-amber-400 mb-1">Protocol Law 10.2</div>
          <div className="text-xs text-slate-400">
            A delegation chain SHALL NOT exceed a maximum depth of 3 hops (Delegator → Delegate₁ → Delegate₂ → Delegate₃).
            Deeper delegation chains MUST be rejected with <code className="font-mono text-amber-300">ERR_DELEGATION_DEPTH_EXCEEDED</code>.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chain Visualization */}
        <div className="glass-card p-6">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-5 flex items-center justify-between">
            Delegation Chain
            <span className={`text-xs font-mono font-bold ${extraDepth ? 'text-red-400' : 'text-emerald-400'}`}>
              Depth: {displayChain.length} / {MAX_DELEGATION_DEPTH}
            </span>
          </div>

          <div className="flex flex-col gap-0">
            {displayNodes.map((node, i) => {
              const colors = colorForNode(i, displayNodes.length);
              const proof = displayChain[i - 1]; // proof connecting prev to this node
              return (
                <div key={node.rid}>
                  {i > 0 && (
                    <div className="flex flex-col items-center py-2">
                      <div className="w-px h-3 bg-slate-700" />
                      <div className="glass-card px-3 py-1 text-[10px] font-mono text-slate-500 text-center">
                        Depth {i} · {proof?.allowedScopes.join(', ')}
                        {i === MAX_DELEGATION_DEPTH && !extraDepth && <span className="ml-1 text-emerald-400">← MAX</span>}
                        {extraDepth && i >= MAX_DELEGATION_DEPTH && <span className="ml-1 text-red-400">← EXCEEDS MAX</span>}
                      </div>
                      <div className="w-px h-3 bg-slate-700" />
                      <div className="text-slate-600 text-xs">↓</div>
                    </div>
                  )}
                  <div className={`p-4 rounded-xl border ${colors.bg} ${colors.border}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold ${colors.label}`}>{node.label}</span>
                      <span className={`text-[10px] font-mono ${colors.text}`}>{node.role}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-600 truncate">{node.rid.substring(0, 42)}...</div>
                    {i === 0 && <div className="mt-1 text-[10px] text-slate-600">Root Issuer — No delegation required</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add/Remove extra hop */}
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => { setExtraDepth(!extraDepth); setValidationResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                extraDepth
                  ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/15'
                  : 'border-slate-600 bg-slate-800/30 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              <Plus size={13} />
              {extraDepth ? 'Remove Level 4 (Fix)' : 'Add Level 4 (Exceed Limit)'}
            </button>
            <button
              onClick={handleValidate}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-medium hover:bg-teal-500/15 transition-all"
            >
              <CheckCircle size={13} />
              Validate Chain
            </button>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          {/* Validation result */}
          {validationResult && (
            <div className={`glass-card p-5 border ${validationResult.valid ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
              <div className="flex items-center gap-2 mb-3">
                {validationResult.valid
                  ? <CheckCircle size={18} className="text-emerald-400" />
                  : <XCircle size={18} className="text-red-400" />
                }
                <span className={`font-bold text-sm ${validationResult.valid ? 'text-emerald-300' : 'text-red-300'}`}>
                  {validationResult.valid ? 'VALID DELEGATION CHAIN' : 'DELEGATION REJECTED'}
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Depth</span>
                  <span className={validationResult.depth > MAX_DELEGATION_DEPTH ? 'text-red-400' : 'text-teal-300'}>
                    {validationResult.depth} / {MAX_DELEGATION_DEPTH}
                  </span>
                </div>
                {!validationResult.valid && (
                  <div className="mt-2 p-3 bg-red-500/8 rounded-lg border border-red-500/20 text-red-400/80 text-[11px]">
                    {validationResult.reason}
                  </div>
                )}
                {validationResult.valid && (
                  <div className="mt-2 p-3 bg-emerald-500/8 rounded-lg border border-emerald-500/20 text-emerald-400/80 text-[11px]">
                    All hops verified. Scope VERIFY_ENROLLMENT authorized throughout chain.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Proof details */}
          {displayChain.map((proof, i) => (
            <div key={proof.delegationId} className="glass-card p-4">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Delegation Proof — Hop {i + 1}</div>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Delegation ID', value: proof.delegationId.substring(0, 36) + '...', mono: true },
                  { label: 'Delegator', value: proof.delegatorRid.substring(0, 32) + '...', mono: true },
                  { label: 'Delegate', value: proof.delegateRid.substring(0, 32) + '...', mono: true },
                  { label: 'Scopes', value: proof.allowedScopes.join(', '), mono: true },
                  { label: 'Depth', value: `${proof.depth} / ${proof.maxDepth}`, mono: true },
                  { label: 'Valid Until', value: new Date(proof.validUntil).toLocaleString() },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className="text-[10px] text-slate-500 w-24 flex-shrink-0 pt-0.5 uppercase tracking-wide">{label}</span>
                    <span className={`text-[11px] break-all ${mono ? 'font-mono text-teal-300' : 'text-slate-300'}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Depth guide */}
          <div className="glass-card p-4">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Depth Rules</div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map(d => (
                <div key={d} className={`flex items-center gap-3 text-xs ${d > 3 ? 'text-red-400' : 'text-slate-400'}`}>
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    d <= 3 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                  }`}>{d}</span>
                  {d === 1 && 'Root → First delegate (Registrar)'}
                  {d === 2 && 'Registrar → Second delegate (Officer)'}
                  {d === 3 && 'Officer → Third delegate — MAX ALLOWED'}
                  {d === 4 && 'Level 4 → EXCEEDS MAXIMUM → REJECTED'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
