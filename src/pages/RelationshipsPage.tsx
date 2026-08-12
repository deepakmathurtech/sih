import React, { useState } from 'react';
import { Network, ArrowDown, ChevronDown, ChevronRight, Shield, User, Building } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { MOCK_IDENTITIES } from '../data/mockIdentities';
import { DEMO_SCENARIOS } from '../data/mockCredentials';
import StatusBadge from '../components/common/StatusBadge';
import RIDDisplay from '../components/common/RIDDisplay';

export default function RelationshipsPage() {
  const { state, revokeRelationship } = useAppStore();
  const [selectedRRID, setSelectedRRID] = useState<string | null>(null);

  const relationships = Array.from(state.protocolState.relationshipRegistry.values());

  const selectedRel = selectedRRID
    ? relationships.find(r => r.rrid === selectedRRID)
    : relationships[0] ?? null;

  const getEntityLabel = (rid: string) => {
    return Object.values(MOCK_IDENTITIES).find(id => id.rid === rid)?.entityLabel ?? rid.substring(0, 20) + '...';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Network size={20} className="text-teal-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Relationship Objects</h1>
          <p className="text-xs text-slate-500">Dual-attested RRID binding pairs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Relationship List */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 px-1">Registered Relationships</div>
          {relationships.map(rel => {
            const issuerLabel = getEntityLabel(rel.issuerRid);
            const subjectLabel = getEntityLabel(rel.subjectRid);
            const isSelected = selectedRRID === rel.rrid || (!selectedRRID && rel === relationships[0]);

            return (
              <button
                key={rel.rrid}
                onClick={() => setSelectedRRID(rel.rrid)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-teal-500/40 bg-teal-500/8'
                    : 'border-slate-700/40 hover:border-slate-600/60 bg-slate-900/20'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-xs font-medium text-slate-200">{issuerLabel}</div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-600 my-1">
                      <ArrowDown size={10} />
                      <span className="font-mono">{rel.type}</span>
                    </div>
                    <div className="text-xs text-slate-300">{subjectLabel}</div>
                  </div>
                  <StatusBadge status={rel.status} />
                </div>
                <div className="text-[10px] font-mono text-slate-600 truncate">{rel.rrid.substring(0, 35)}...</div>
              </button>
            );
          })}
        </div>

        {/* Relationship Detail */}
        {selectedRel && (
          <div className="lg:col-span-2 space-y-4">
            {/* Visual diagram */}
            <div className="glass-card p-6">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-5">Relationship Object Visualization</div>
              <div className="flex flex-col items-center gap-2">
                {/* Issuer node */}
                <div className="flex items-center gap-3 w-full max-w-md p-4 rounded-xl bg-indigo-500/8 border border-indigo-500/25">
                  <div className="p-2 bg-indigo-500/15 rounded-lg">
                    <Building size={16} className="text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-indigo-300">ISSUER RID</div>
                    <div className="text-sm font-medium text-white">{getEntityLabel(selectedRel.issuerRid)}</div>
                    <div className="text-[10px] font-mono text-indigo-300/60">{selectedRel.issuerRid.substring(0, 40)}...</div>
                  </div>
                </div>

                {/* Connection */}
                <div className="flex flex-col items-center py-2 relative">
                  <div className="w-px h-6 bg-teal-500/40" />
                  <div className="glass-card px-5 py-2 text-center">
                    <div className="text-[10px] text-teal-400 font-mono font-bold">{selectedRel.type}</div>
                    <div className="text-[10px] text-slate-500">{selectedRel.scope}</div>
                  </div>
                  <div className="w-px h-6 bg-teal-500/40" />
                  <div className="w-3 h-3 border-b-2 border-r-2 border-teal-500/60 rotate-45 -mt-2" />
                </div>

                {/* Subject node */}
                <div className="flex items-center gap-3 w-full max-w-md p-4 rounded-xl bg-teal-500/8 border border-teal-500/25">
                  <div className="p-2 bg-teal-500/15 rounded-lg">
                    <User size={16} className="text-teal-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-teal-300">SUBJECT RID</div>
                    <div className="text-sm font-medium text-white">{getEntityLabel(selectedRel.subjectRid)}</div>
                    <div className="text-[10px] font-mono text-teal-300/60">{selectedRel.subjectRid.substring(0, 40)}...</div>
                  </div>
                </div>
              </div>

              {/* RRID derivation formula */}
              <div className="mt-5 p-4 bg-slate-900/50 rounded-xl border border-slate-800/50">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">RRID Derivation</div>
                <div className="font-mono text-[11px] text-slate-400 space-y-1">
                  <div className="text-indigo-400">RRID = SHA256(</div>
                  <div className="pl-4 text-slate-300">RID_A  <span className="text-slate-600">// Issuer Root Identity</span></div>
                  <div className="pl-4 text-slate-300">|| RID_B  <span className="text-slate-600">// Subject Root Identity</span></div>
                  <div className="pl-4 text-slate-300">|| nonce  <span className="text-slate-600">// {selectedRel.nonce.substring(0, 16)}...</span></div>
                  <div className="pl-4 text-slate-300">|| timestamp  <span className="text-slate-600">// {selectedRel.timestamp}</span></div>
                  <div className="text-indigo-400">)</div>
                </div>
              </div>
            </div>

            {/* Field details */}
            <div className="glass-card p-5">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-4">Relationship Object Fields</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                {[
                  { label: 'RRID', value: selectedRel.rrid, mono: true, full: true },
                  { label: 'Status', badge: selectedRel.status },
                  { label: 'Type', value: selectedRel.type, mono: true },
                  { label: 'Scope', value: selectedRel.scope, mono: true },
                  { label: 'Nonce', value: selectedRel.nonce, mono: true },
                  { label: 'Timestamp', value: new Date(selectedRel.timestamp).toLocaleString() },
                  { label: 'TTL', value: `${selectedRel.ttl}s` },
                  { label: 'Expires At', value: new Date(selectedRel.expiresAt).toLocaleString() },
                ].map(({ label, value, badge, mono, full }) => (
                  <div key={label} className={`${full ? 'md:col-span-2' : ''}`}>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{label}</div>
                    {badge ? <StatusBadge status={badge} size="md" /> : (
                      <div className={`text-xs ${mono ? 'font-mono text-teal-300 break-all' : 'text-slate-300'}`}>{value}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Signatures & Actions */}
            <div className="glass-card p-5 space-y-4">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Dual Attestation Signatures</div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={12} className="text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-semibold">Issuer Signature</span>
                    <StatusBadge status="VALID" size="sm" />
                  </div>
                  <code className="text-[10px] font-mono text-slate-400 break-all">{selectedRel.issuerSignature}</code>
                </div>
                <div className="p-3 rounded-lg bg-teal-500/5 border border-teal-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={12} className="text-teal-400" />
                    <span className="text-xs text-teal-400 font-semibold">Holder Signature</span>
                    <StatusBadge status="VALID" size="sm" />
                  </div>
                  <code className="text-[10px] font-mono text-slate-400 break-all">{selectedRel.subjectSignature}</code>
                </div>
              </div>

              {/* State Management Action */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Relationship State Control</div>
                  <div className="text-[10px] text-slate-500">Revoking this relationship will cause subsequent verification attempts to fail with ERR_RELATIONSHIP_REVOKED</div>
                </div>
                {selectedRel.status === 'ACTIVE' ? (
                  <button
                    onClick={() => revokeRelationship(selectedRel.rrid)}
                    className="flex-shrink-0 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/20 transition-all"
                  >
                    Revoke Relationship
                  </button>
                ) : (
                  <StatusBadge status={selectedRel.status} size="md" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
