import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, Lock, Zap, GitBranch, Eye, RotateCcw, FileCheck } from 'lucide-react';

const FEATURES = [
  { icon: Lock, label: 'PII-Minimized', desc: 'No personal data in public identifiers' },
  { icon: Zap, label: 'Local Verification', desc: 'Deterministic, no round-trip required' },
  { icon: Shield, label: 'Dual Attestation', desc: 'Issuer + Holder co-signatures' },
  { icon: RotateCcw, label: 'Replay Protection', desc: 'Nonce cache + 300s timestamp window' },
  { icon: GitBranch, label: 'Bounded Delegation', desc: 'Max depth 3 hops (LAW 10.2)' },
  { icon: Eye, label: 'Cryptographic Auditability', desc: 'Append-only Merkle audit log' },
];

const COMPARISON = [
  { traditional: 'Verify document fields', ridtp: 'Verify cryptographic relationship' },
  { traditional: 'Store copies of PII', ridtp: 'Store only RID + relationship hash' },
  { traditional: 'Trust the document', ridtp: 'Trust the math' },
  { traditional: 'No replay protection', ridtp: '300s nonce + timestamp window' },
  { traditional: 'Static revocation', ridtp: 'Live state-based revocation' },
];

export default function HomePage() {
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);

  return (
    <div className="min-h-full">
      <section className="relative overflow-hidden px-6 pt-20 pb-16 max-w-5xl mx-auto">
        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(71,85,105,0.15) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />

        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium">
            <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
            Root Identity Distribution and Transfer Protocol
          </div>

          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            <span className="text-white">Verify</span>{' '}
            <span className="gradient-text">Relationships.</span>
            <br />
            <span className="text-white">Not Just</span>{' '}
            <span className="text-slate-400">Documents.</span>
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            RIDTP enables privacy-preserving, deterministic verification of identity relationships
            and delegated authority — without requiring every verifier to maintain duplicated personal data.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link
              to="/verify"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 text-slate-950 font-semibold text-sm hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20"
            >
              <Shield size={16} />
              Verify Credential
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/architecture"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:border-slate-500 hover:text-white transition-all"
            >
              <FileCheck size={16} />
              Explore RIDTP
            </Link>
          </div>

          {/* Feature pills */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="glass-card p-4 text-left hover:border-teal-500/30 transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} className="text-teal-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-200">{label}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Concept Diagram */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-2">How RIDTP Verification Works</h2>
          <p className="text-slate-500 text-sm">Click any protocol node to view its technical explanation.</p>
        </div>

        <div className="glass-card p-8 max-w-2xl mx-auto">
          <div className="flex flex-col items-center gap-0 font-mono text-sm">
            {[
              { id: 'rid', label: 'ROOT IDENTITY', sublabel: 'RID: sha256(pubkey)', color: 'text-indigo-400', border: 'border-indigo-500/30 bg-indigo-500/10 hover:border-indigo-400', exp: 'Root Identity (RID) is mathematically derived via SHA-256 over canonical Ed25519 public key data. Zero personal attributes or names are stored.' },
              null,
              { id: 'rel', label: 'RELATIONSHIP OBJECT', sublabel: 'University RID ↔ Student RID', color: 'text-teal-400', border: 'border-teal-500/30 bg-teal-500/10 hover:border-teal-400', exp: 'Dual-attested relationship binding RRID created between Issuer RID and Subject RID for a specific type and scope.' },
              null,
              { id: 'attestation', label: 'DUAL ATTESTATION', sublabel: 'Issuer Sig ✓  •  Holder Sig ✓', color: 'text-blue-400', border: 'border-blue-500/30 bg-blue-500/10 hover:border-blue-400', exp: 'Requires co-signatures from both the credential issuer and subject, preventing unilateral claim forgery.' },
              null,
              { id: 'envelope', label: 'PROOF ENVELOPE', sublabel: 'Nonce + Timestamp + Scope', color: 'text-purple-400', border: 'border-purple-500/30 bg-purple-500/10 hover:border-purple-400', exp: 'Contains single-use nonce, 300s timestamp window, and delegation proof allowing deterministic verification.' },
              null,
              { id: 'runtime', label: 'DETERMINISTIC STATE', sublabel: "σ' = f(σ, m)  →  ACTIVE ✓", color: 'text-emerald-400', border: 'border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-400', exp: 'Pure state function updates Sparse Merkle Tree state root, guaranteeing identical verification outputs across independent nodes.' },
            ].map((item, i) =>
              item === null ? (
                <div key={i} className="flex flex-col items-center gap-1 py-1">
                  <div className="w-px h-4 bg-slate-700" />
                  <div className="text-slate-600 text-base">↓</div>
                </div>
              ) : (
                <button
                  key={item.id}
                  onClick={() => setSelectedNode(selectedNode === item.id ? null : item.id)}
                  className={`w-full text-center px-6 py-3 rounded-lg border transition-all cursor-pointer ${item.border} ${selectedNode === item.id ? 'ring-2 ring-teal-400' : ''}`}
                >
                  <div className={`font-bold text-sm ${item.color}`}>{item.label}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{item.sublabel}</div>
                  {selectedNode === item.id && (
                    <div className="mt-3 pt-2 border-t border-slate-700/60 font-sans text-xs text-slate-300 font-normal leading-relaxed text-left">
                      {item.exp}
                    </div>
                  )}
                </button>
              )
            )}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="px-6 py-12 max-w-5xl mx-auto border-t border-slate-800/50">
        <h2 className="text-xl font-bold text-white mb-6 text-center">Traditional vs. RIDTP Verification</h2>
        <div className="glass-card overflow-hidden">
          <div className="grid grid-cols-2 border-b border-slate-800">
            <div className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-widest border-r border-slate-800">
              Traditional Document Verification
            </div>
            <div className="px-5 py-3 text-xs font-semibold text-teal-400 uppercase tracking-widest">
              RIDTP Relationship Verification
            </div>
          </div>
          {COMPARISON.map(({ traditional, ridtp }, i) => (
            <div key={i} className={`grid grid-cols-2 border-b border-slate-800/50 last:border-0 ${i % 2 === 0 ? 'bg-slate-900/20' : ''}`}>
              <div className="px-5 py-3 text-sm text-slate-400 border-r border-slate-800/50 flex items-center gap-2">
                <span className="text-red-500/60">✗</span> {traditional}
              </div>
              <div className="px-5 py-3 text-sm text-slate-200 flex items-center gap-2">
                <span className="text-teal-400">✓</span> {ridtp}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 max-w-5xl mx-auto text-center">
        <div className="glass-card p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-indigo-500/5 pointer-events-none" />
          <h2 className="text-2xl font-bold text-white mb-3">Try the Live Demo</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Run all 6 demonstration scenarios — valid credentials, tampered proofs, replay attacks, revocation, expiry, and delegation limits.
          </p>
          <Link
            to="/verify"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-xl shadow-teal-500/20"
          >
            Open Verification Interface
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
