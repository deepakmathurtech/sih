import React from 'react';
import {
  LayoutDashboard, Shield, CheckCircle, XCircle, RotateCcw,
  Clock, AlertTriangle, TrendingUp, Hash, Link as LinkIcon
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import MetricCard from '../components/common/MetricCard';
import StatusBadge from '../components/common/StatusBadge';

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function DashboardPage() {
  const { state } = useAppStore();
  const { stats, verificationHistory, auditLog, protocolState, merkleRoot } = state;

  const recentActivity = verificationHistory.slice(0, 8);

  // Static seeded recent activity for first load
  const seedActivity = [
    { time: '14:32', rel: 'University → Student', status: 'VERIFIED', proof: 'Valid', latency: '0.7', id: '1' },
    { time: '14:30', rel: 'Employer → Student', status: 'VERIFIED', proof: 'Valid', latency: '0.6', id: '2' },
    { time: '14:28', rel: 'College → Student', status: 'REVOKED', proof: 'Invalid', latency: '0.8', id: '3' },
    { time: '14:15', rel: 'University → Student', status: 'VERIFIED', proof: 'Valid', latency: '0.5', id: '4' },
    { time: '14:02', rel: 'DigiLocker → Student', status: 'VERIFIED', proof: 'Valid', latency: '0.9', id: '5' },
  ];

  const displayActivity = recentActivity.length > 0
    ? recentActivity.map(r => ({
        time: formatTime(r.timestamp),
        rel: `${r.issuerLabel} → ${r.subjectLabel}`,
        status: r.outcome,
        proof: r.proofStatus,
        latency: r.totalLatencyMs.toFixed(1),
        id: r.id,
      }))
    : seedActivity;

  const avgLatency = recentActivity.length > 0
    ? (recentActivity.reduce((a, r) => a + r.totalLatencyMs, 0) / recentActivity.length).toFixed(2)
    : '0.74';

  const relationshipCount = protocolState.relationshipRegistry.size;
  const rootCount = protocolState.rootRegistry.size;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <LayoutDashboard size={20} className="text-teal-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Command Center</h1>
          <p className="text-xs text-slate-500">Real-time RIDTP verification activity</p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          LIVE
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricCard title="Total Verifications" value={stats.total} icon={Shield} color="teal" trend={{ value: 12, label: '24h' }} />
        <MetricCard title="Verified" value={stats.verified} icon={CheckCircle} color="emerald" />
        <MetricCard title="Rejected" value={stats.rejected} icon={XCircle} color="red" />
        <MetricCard title="Revoked" value={stats.revoked} icon={AlertTriangle} color="orange" />
        <MetricCard title="Expired" value={stats.expired} icon={Clock} color="yellow" />
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Avg Verification Time" value={`${avgLatency} ms`} icon={TrendingUp} color="blue" />
        <MetricCard title="Active Relationships" value={relationshipCount} icon={LinkIcon} color="indigo" />
        <MetricCard title="Registered RIDs" value={rootCount} icon={Hash} color="slate" />
      </div>

      {/* Main content row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Table */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent Verification Activity</h2>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <RotateCcw size={11} />
              Updates in real-time
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800/30">
                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-600">Time</th>
                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-600">Relationship</th>
                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-600">Status</th>
                  <th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-600">Proof</th>
                  <th className="px-5 py-3 text-right text-[10px] uppercase tracking-widest text-slate-600">Latency</th>
                </tr>
              </thead>
              <tbody>
                {displayActivity.map((row, i) => (
                  <tr key={row.id + i} className="border-b border-slate-800/20 hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-3 font-mono text-slate-500">{row.time}</td>
                    <td className="px-5 py-3 text-slate-300">{row.rel}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] font-mono ${row.proof === 'Valid' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {row.proof}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-slate-500">{row.latency} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* State Info */}
        <div className="space-y-4">
          {/* Merkle Root */}
          <div className="glass-card p-5">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Current Merkle Root</div>
            <code className="text-[11px] font-mono text-indigo-300 break-all leading-relaxed">
              {merkleRoot.substring(0, 32)}<br />{merkleRoot.substring(32)}
            </code>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-600">
              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
              Seq #{protocolState.sequenceNumber}
            </div>
          </div>

          {/* Registered RIDs */}
          <div className="glass-card p-5">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Registered Root Identities</div>
            <div className="space-y-2">
              {Array.from(protocolState.rootRegistry.values()).map(id => (
                <div key={id.rid} className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-300">{id.entityLabel}</div>
                    <div className="text-[10px] font-mono text-slate-600">{id.rid.substring(0, 30)}...</div>
                  </div>
                  <StatusBadge status={id.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Audit Events */}
          <div className="glass-card p-5">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Recent Audit Events</div>
            <div className="space-y-2">
              {auditLog.slice(-4).reverse().map(event => (
                <div key={event.eventId} className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${event.status === 'SUCCESS' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <div>
                    <div className="text-[11px] text-slate-300 font-mono">{event.eventType}</div>
                    <div className="text-[10px] text-slate-600">{formatTime(event.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Protocol Health */}
      <div className="glass-card p-5">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-4">Protocol Health</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { label: 'State Runtime', status: 'OPERATIONAL', color: 'text-emerald-400' },
            { label: 'Nonce Cache', status: `${state.nonceCache.size()} entries`, color: 'text-teal-400' },
            { label: 'Replay Window', status: '300s', color: 'text-blue-400' },
            { label: 'Delegation Limit', status: 'Depth 3', color: 'text-indigo-400' },
          ].map(item => (
            <div key={item.label} className="glass-card-light p-3">
              <div className={`text-sm font-mono font-bold ${item.color}`}>{item.status}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
