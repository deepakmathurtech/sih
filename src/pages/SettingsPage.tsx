import React, { useState } from 'react';
import { Settings, Play, CheckCircle, RotateCcw, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { DEMO_SCENARIOS } from '../data/mockCredentials';
import { runProtocolTests } from '../tests/protocol.test';
import type { TestResult } from '../types';
import StatusBadge from '../components/common/StatusBadge';

export default function SettingsPage() {
  const { state, activateScenario, resetScenario } = useAppStore();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const handleRunTests = async () => {
    setTesting(true);
    const results = await runProtocolTests();
    setTestResults(results);
    setTesting(false);
  };

  const passCount = testResults.filter(r => r.status === 'pass').length;
  const passPercent = testResults.length > 0 ? Math.round((passCount / testResults.length) * 100) : null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Settings size={20} className="text-teal-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Settings & Conformance Test Suite</h1>
          <p className="text-xs text-slate-500">Protocol parameter configuration and live test runner</p>
        </div>
      </div>

      {/* Protocol Test Suite Indicator */}
      <div className="glass-card p-6 border border-teal-500/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-teal-400" />
              RIDTP Conformance Test Suite
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Executes 11 core protocol law & cryptographic verification unit tests in real-time</p>
          </div>

          <div className="flex items-center gap-3">
            {passPercent !== null && (
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded border ${
                passPercent === 100 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
              }`}>
                Protocol Tests: {passPercent}% PASS
              </span>
            )}
            <button
              onClick={handleRunTests}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 text-slate-950 text-xs font-semibold hover:bg-teal-400 transition-all"
            >
              {testing ? 'Running Suite...' : 'Run Test Suite'}
            </button>
          </div>
        </div>

        {/* Test Results Grid */}
        {testResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-slate-800/60">
            {testResults.map(test => (
              <div key={test.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {test.status === 'pass' ? (
                    <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                  )}
                  <span className="text-slate-300 font-medium">{test.name}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">{test.latencyMs.toFixed(1)}ms</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preset Scenarios Quick Launch */}
      <div className="glass-card p-6">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-4 font-bold">
          Demo Presets & Quick Reset
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DEMO_SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => activateScenario(s.id)}
              className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 text-left hover:border-teal-500/40 transition-all"
            >
              <div className="text-xs font-semibold text-slate-200">{s.name}</div>
              <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">{s.description}</div>
            </button>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-800/60 flex justify-end">
          <button
            onClick={resetScenario}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-800 transition-all"
          >
            <RotateCcw size={13} />
            Reset Environment State
          </button>
        </div>
      </div>
    </div>
  );
}
