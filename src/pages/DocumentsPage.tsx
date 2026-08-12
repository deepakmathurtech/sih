import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText, Plus, Shield, CheckCircle, XCircle, Search,
  Filter, ArrowRight, Link as LinkIcon, RotateCcw, Building, User, Eye
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { RIDTPCredential, RelationshipType } from '../types';
import StatusBadge from '../components/common/StatusBadge';
import RIDDisplay from '../components/common/RIDDisplay';
import { createRelationship } from '../protocol/relationship';
import { createProofEnvelope } from '../protocol/proofEnvelope';
import { MOCK_IDENTITIES } from '../data/mockIdentities';
import { sha256Sync } from '../crypto';

export default function DocumentsPage() {
  const { state, addCredential, revokeRelationship } = useAppStore();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Wizard form state
  const [docTitle, setDocTitle] = useState('Academic Credential B.Tech');
  const [docType, setDocType] = useState<RelationshipType>('ACADEMIC_CREDENTIAL');
  const [issuerKey, setIssuerKey] = useState('shardaUniversity');
  const [subjectKey, setSubjectKey] = useState('student');
  const [scope, setScope] = useState('VERIFY_ENROLLMENT');
  const [refId, setRefId] = useState('CRED-2026-9901');

  const credentials = state.credentials;

  // Filtered credentials
  const filteredCredentials = credentials.filter(c => {
    const matchesSearch =
      (c.documentTitle ?? c.type).toLowerCase().includes(search.toLowerCase()) ||
      c.issuerName.toLowerCase().includes(search.toLowerCase()) ||
      c.subjectName.toLowerCase().includes(search.toLowerCase()) ||
      (c.credentialReference ?? c.id).toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'CONNECTED') return c.documentStatus === 'CONNECTED';
    if (statusFilter === 'ACTIVE') return c.relationship.status === 'ACTIVE';
    if (statusFilter === 'REVOKED') return c.relationship.status === 'REVOKED';
    return true;
  });

  const totalDocs = credentials.length;
  const connectedDocs = credentials.filter(c => c.documentStatus === 'CONNECTED').length;
  const activeDocs = credentials.filter(c => c.relationship.status === 'ACTIVE').length;
  const revokedDocs = credentials.filter(c => c.relationship.status === 'REVOKED').length;

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    const issuer = MOCK_IDENTITIES[issuerKey] ?? MOCK_IDENTITIES.shardaUniversity;
    const subject = MOCK_IDENTITIES[subjectKey] ?? MOCK_IDENTITIES.student;

    const rel = createRelationship(
      issuer.rid, subject.rid,
      docType, scope,
      86400 * 365,
      `doc_seed_${Date.now()}`
    );

    const env = createProofEnvelope(rel, `doc_env_seed_${Date.now()}`);

    const newCred: RIDTPCredential = {
      id: sha256Sync(`doc:${docTitle}:${Date.now()}`).substring(0, 16),
      type: docType,
      issuerName: issuer.entityLabel,
      subjectName: subject.entityLabel,
      issuerRid: issuer.rid,
      subjectRid: subject.rid,
      proofEnvelope: env,
      relationship: rel,
      isDemo: true,
      demoLabel: 'SYNTHETIC DEMONSTRATION CREDENTIAL — NOT AN OFFICIAL DOCUMENT',
      documentTitle: docTitle,
      documentStatus: 'CONNECTED',
      issueDate: Date.now(),
      expiryDate: Date.now() + 365 * 24 * 3600 * 1000,
      credentialReference: refId,
    };

    addCredential(newCred);
    setShowCreateModal(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-teal-400" />
          <div>
            <h1 className="text-xl font-bold text-white">Document & Credential Registry</h1>
            <p className="text-xs text-slate-500">Connect documents to RIDTP identity relationships</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConnectModal(true)}
            className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500 text-xs font-medium transition-all"
          >
            Connect Existing Document
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 text-slate-950 text-xs font-semibold hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20"
          >
            <Plus size={14} />
            Create Document
          </button>
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Total Documents</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{totalDocs}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">RIDTP Connected</div>
          <div className="text-2xl font-bold font-mono text-teal-400 mt-1">{connectedDocs}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Active Relationships</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{activeDocs}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Revoked</div>
          <div className="text-2xl font-bold font-mono text-red-400 mt-1">{revokedDocs}</div>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents by title, ID, issuer..."
            className="w-full bg-slate-900/60 border border-slate-700/60 text-xs text-slate-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:border-teal-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'CONNECTED', 'ACTIVE', 'REVOKED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                statusFilter === st
                  ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCredentials.map(cred => {
          const isRevoked = cred.relationship.status === 'REVOKED';

          return (
            <div key={cred.id} className="glass-card p-5 flex flex-col justify-between space-y-4 hover:border-slate-600 transition-all">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                    {cred.credentialReference ?? `CRED-${cred.id.substring(0, 6).toUpperCase()}`}
                  </span>
                  <StatusBadge status={cred.relationship.status} />
                </div>

                <h3 className="text-sm font-bold text-white mb-1">
                  {cred.documentTitle ?? cred.type}
                </h3>
                <div className="text-[11px] text-slate-400 mb-3">{cred.type}</div>

                <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Issuer:</span>
                    <span className="text-slate-200 font-medium">{cred.issuerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Holder:</span>
                    <span className="text-slate-200 font-medium">{cred.subjectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scope:</span>
                    <span className="font-mono text-teal-300 text-[10px]">{cred.relationship.scope}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/60 space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">RIDTP Connection:</span>
                  <span className="text-emerald-400 font-mono font-semibold">✓ CONNECTED</span>
                </div>

                <div className="flex gap-2">
                  <Link
                    to="/verify"
                    className="flex-1 text-center py-2 rounded-lg bg-teal-500 text-slate-950 font-semibold text-xs hover:bg-teal-400 transition-all flex items-center justify-center gap-1"
                  >
                    Verify Now
                    <ArrowRight size={12} />
                  </Link>

                  {isRevoked ? (
                    <div className="px-3 py-2 text-xs font-mono text-red-400 text-center bg-red-500/10 rounded-lg">REVOKED</div>
                  ) : (
                    <button
                      onClick={() => revokeRelationship(cred.relationship.rrid)}
                      className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-mono transition-all"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Document Modal Wizard */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="glass-card p-6 max-w-xl w-full border border-slate-700 shadow-2xl space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Shield size={16} className="text-teal-400" />
                Create & Connect Document to RIDTP
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Document Title</label>
                <input
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Credential Type</label>
                  <select
                    value={docType}
                    onChange={e => setDocType(e.target.value as RelationshipType)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="ACADEMIC_CREDENTIAL">ACADEMIC_CREDENTIAL</option>
                    <option value="EMPLOYMENT">EMPLOYMENT</option>
                    <option value="FINANCIAL">FINANCIAL</option>
                    <option value="GOVERNMENT_ID">GOVERNMENT_ID</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Reference ID</label>
                  <input
                    value={refId}
                    onChange={e => setRefId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Issuer Entity</label>
                  <select
                    value={issuerKey}
                    onChange={e => setIssuerKey(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="shardaUniversity">Sharda University</option>
                    <option value="employer">TechCorp India</option>
                    <option value="government">DigiLocker Government</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Holder Entity</label>
                  <select
                    value={subjectKey}
                    onChange={e => setSubjectKey(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="student">Deepak Sharma (Student)</option>
                    <option value="verificationOfficer">Verification Officer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Scope Scope</label>
                <input
                  value={scope}
                  onChange={e => setScope(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 font-mono text-teal-300 outline-none"
                  required
                />
              </div>

              {/* Realistic Document Preview Card */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center font-mono space-y-1">
                <div className="text-[10px] text-amber-400 uppercase tracking-widest font-bold">SYNTHETIC DEMONSTRATION DOCUMENT</div>
                <div className="text-sm font-bold text-white pt-1">{docTitle}</div>
                <div className="text-[10px] text-slate-400">Issuer: {MOCK_IDENTITIES[issuerKey]?.entityLabel}</div>
                <div className="text-[10px] text-slate-400">Holder: {MOCK_IDENTITIES[subjectKey]?.entityLabel}</div>
                <div className="text-[9px] text-teal-400 pt-2">Dual Ed25519 Signatures Generated ✓</div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20"
              >
                Create Document & Generate RIDTP Relationship
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Connect Existing Document Info Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setShowConnectModal(false)}>
          <div className="glass-card p-6 max-w-md w-full border border-slate-700 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Connect Existing Document</h3>
              <button onClick={() => setShowConnectModal(false)} className="text-slate-500 hover:text-white text-xs">✕</button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Connecting a document does not automatically mean the document is authentic. RIDTP establishes and verifies the cryptographic relationship and state associated with the credential.
            </p>
            <button
              onClick={() => { setShowConnectModal(false); setShowCreateModal(true); }}
              className="w-full py-2.5 rounded-lg bg-teal-500 text-slate-950 font-semibold text-xs hover:bg-teal-400 transition-all"
            >
              Proceed to Wizard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
