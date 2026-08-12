import React, { useState } from 'react';
import { Cpu, ArrowRight, Shield, Layers, GitBranch, Database, Check } from 'lucide-react';

const COMPONENTS = [
  {
    id: 'verifier',
    title: 'Verifier Interface',
    desc: 'Requests verification of credentials without receiving or storing underlying personal data (PII).',
    tech: 'Local Browser/Edge Runtime'
  },
  {
    id: 'runtime',
    title: 'Deterministic State Runtime',
    desc: 'Pure state function f(σ, m) that updates state deterministically across independent validator nodes.',
    tech: 'Algorithm 1.1 / Sparse Merkle Tree'
  },
  {
    id: 'rid',
    title: 'Root Identity (RID) Anchor',
    desc: 'Mathematical identifier derived via SHA-256(canonical(Public Key)). Completely isolated from PII.',
    tech: 'RFC 8785 Canonical JSON + Ed25519'
  },
  {
    id: 'rel',
    title: 'Relationship Object Engine',
    desc: 'Dual-attested relationship binding RRID created between Issuer RID and Subject RID.',
    tech: 'Dual Digital Signatures'
  },
  {
    id: 'delegation',
    title: 'Delegation Engine',
    desc: 'Enforces bounded, scoped delegation chains up to a strict maximum of 3 hops (LAW 10.2).',
    tech: 'Scope Allowlist & Depth Check'
  },
  {
    id: 'ledger',
    title: 'Audit / State Ledger',
    desc: 'Append-only cryptographic event log providing byte-for-byte state reproducibility.',
    tech: 'Merkle Hash Chain'
  }
];

export default function ArchitecturePage() {
  const [selectedComp, setSelectedComp] = useState(COMPONENTS[1]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Cpu size={20} className="text-teal-400" />
        <div>
          <h1 className="text-xl font-bold text-white">RIDTP Architecture</h1>
          <p className="text-xs text-slate-500">Interactive system component breakdown & specs</p>
        </div>
      </div>

      {/* Interactive Diagram */}
      <div className="glass-card p-8 border border-slate-800">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-6 text-center">
          Click any component to inspect architecture specifications
        </div>

        <div className="flex flex-col items-center gap-6 max-w-3xl mx-auto font-mono text-xs">
          {/* Top: Verifier */}
          <button
            onClick={() => setSelectedComp(COMPONENTS[0])}
            className={`w-64 p-4 rounded-xl border text-center transition-all ${
              selectedComp.id === 'verifier' ? 'border-teal-400 bg-teal-500/15 text-teal-300 shadow-lg shadow-teal-500/10' : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="font-bold">VERIFIER</div>
            <div className="text-[10px] text-slate-400 mt-1">Proof Envelope Consumer</div>
          </button>

          <div className="text-slate-500">↓ Proof Envelope Payload</div>

          {/* Middle: State Runtime */}
          <button
            onClick={() => setSelectedComp(COMPONENTS[1])}
            className={`w-80 p-5 rounded-xl border text-center transition-all ${
              selectedComp.id === 'runtime' ? 'border-indigo-400 bg-indigo-500/15 text-indigo-300 shadow-lg shadow-indigo-500/10' : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="font-bold text-sm">Deterministic State Runtime</div>
            <div className="text-[10px] text-slate-400 mt-1">σ' = f(σ, m) Execution Engine</div>
          </button>

          {/* 3 Sub-engines */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <button
              onClick={() => setSelectedComp(COMPONENTS[2])}
              className={`p-3.5 rounded-xl border text-center transition-all ${
                selectedComp.id === 'rid' ? 'border-blue-400 bg-blue-500/15 text-blue-300' : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="font-bold text-xs">Root RID Anchor</div>
              <div className="text-[9px] text-slate-400 mt-0.5">PII-Free Identifiers</div>
            </button>

            <button
              onClick={() => setSelectedComp(COMPONENTS[3])}
              className={`p-3.5 rounded-xl border text-center transition-all ${
                selectedComp.id === 'rel' ? 'border-purple-400 bg-purple-500/15 text-purple-300' : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="font-bold text-xs">Relationship Engine</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Dual Attestations</div>
            </button>

            <button
              onClick={() => setSelectedComp(COMPONENTS[4])}
              className={`p-3.5 rounded-xl border text-center transition-all ${
                selectedComp.id === 'delegation' ? 'border-amber-400 bg-amber-500/15 text-amber-300' : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="font-bold text-xs">Delegation Engine</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Bounded Hops</div>
            </button>
          </div>

          <div className="text-slate-500">↓ Commit Leaf</div>

          {/* Bottom: Ledger */}
          <button
            onClick={() => setSelectedComp(COMPONENTS[5])}
            className={`w-72 p-4 rounded-xl border text-center transition-all ${
              selectedComp.id === 'ledger' ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300' : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="font-bold">Audit / State Ledger</div>
            <div className="text-[10px] text-slate-400 mt-1">Sparse Merkle Tree</div>
          </button>
        </div>
      </div>

      {/* Component Details */}
      <div className="glass-card p-6 border border-teal-500/20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">{selectedComp.title}</h2>
          <span className="text-xs font-mono px-3 py-1 bg-teal-500/10 text-teal-300 border border-teal-500/20 rounded-full">
            {selectedComp.tech}
          </span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{selectedComp.desc}</p>
      </div>
    </div>
  );
}
