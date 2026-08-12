import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Shield, Network, FileKey, GitBranch,
  ScrollText, Cpu, Settings, Home, FlaskConical, Menu, X, FileText
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { truncateRID } from '../../crypto';
import { MOCK_IDENTITIES } from '../../data/mockIdentities';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Home', exact: true },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/verify', icon: Shield, label: 'Verify' },
  { to: '/relationships', icon: Network, label: 'Relationships' },
  { to: '/proof-envelope', icon: FileKey, label: 'Proof Envelope' },
  { to: '/delegation', icon: GitBranch, label: 'Delegation' },
  { to: '/audit-log', icon: ScrollText, label: 'Audit Log' },
  { to: '/architecture', icon: Cpu, label: 'Architecture' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppLayout() {
  const { state, dispatch } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [showHealthModal, setShowHealthModal] = React.useState(false);
  const location = useLocation();
  const verifierRid = MOCK_IDENTITIES.employer.rid;

  return (
    <div className={`flex h-screen overflow-hidden ${state.theme === 'light' ? 'bg-slate-50' : 'bg-[#090d13]'}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 flex-shrink-0 flex flex-col
        ${state.theme === 'dark'
          ? 'bg-[#0d1117] border-r border-slate-800/60'
          : 'bg-white border-r border-slate-200'}
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-white tracking-tight">RIDTP</div>
            <div className="text-[10px] text-slate-500 font-mono">Root Identity Protocol</div>
          </div>
          <button
            className="ml-auto lg:hidden text-slate-500 hover:text-slate-300"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Demo Mode Toggle */}
        <div className="px-4 py-3 border-b border-slate-800/40">
          <button
            onClick={() => dispatch({ type: 'SET_DEMO_MODE', payload: !state.demoMode })}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              state.demoMode
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                : 'bg-slate-800/40 text-slate-500 border border-slate-700/40'
            }`}
          >
            <FlaskConical size={13} />
            <span>DEMO MODE</span>
            <div className={`ml-auto w-7 h-4 rounded-full relative transition-colors ${state.demoMode ? 'bg-amber-500' : 'bg-slate-700'}`}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${state.demoMode ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
            </div>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? 'bg-teal-500/10 text-teal-400 border-l-2 border-teal-500 pl-[10px]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }
              `}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Current Verifier RID */}
        <div className="px-4 py-4 border-t border-slate-800/60">
          <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-1.5">Current Verifier RID</div>
          <div className="text-[10px] font-mono text-slate-500 break-all leading-relaxed">
            {verifierRid.substring(0, 40)}...
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className={`flex-shrink-0 flex items-center gap-4 px-5 py-3.5 border-b ${
          state.theme === 'dark' ? 'border-slate-800/60 bg-[#0d1117]/80' : 'border-slate-200 bg-white'
        } backdrop-blur-sm z-10`}>
          <button
            className="lg:hidden text-slate-500 hover:text-slate-300"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumb */}
          <div className="text-slate-500 text-sm">
            {location.pathname === '/' ? 'Home' : location.pathname.split('/').filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')).join(' / ')}
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* System Status Pill */}
            <button
              onClick={() => setShowHealthModal(!showHealthModal)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-400 hover:bg-slate-800 transition-all text-xs font-mono"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SYS: OPERATIONAL</span>
            </button>

            {/* Stats pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
              <span className="text-xs text-teal-400 font-medium">{state.stats.total.toLocaleString()} verifications</span>
            </div>

            {/* Merkle root */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <span className="text-[10px] text-indigo-400 font-mono">H: {state.merkleRoot.substring(0, 8)}…</span>
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
              aria-label="Toggle Theme"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all"
            >
              {state.theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {/* System Health Modal */}
        {showHealthModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setShowHealthModal(false)}>
            <div className="glass-card p-6 max-w-md w-full border border-slate-700 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  RIDTP System Health & Conformance Status
                </h3>
                <button onClick={() => setShowHealthModal(false)} className="text-slate-500 hover:text-white text-xs">✕</button>
              </div>
              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex justify-between p-2.5 bg-slate-950/60 rounded border border-slate-800">
                  <span className="text-slate-400">PROTOCOL ENGINE</span>
                  <span className="text-emerald-400 font-bold">● OPERATIONAL</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-950/60 rounded border border-slate-800">
                  <span className="text-slate-400">CRYPTO ENGINE</span>
                  <span className="text-emerald-400 font-bold">● OPERATIONAL</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-950/60 rounded border border-slate-800">
                  <span className="text-slate-400">STATE RUNTIME</span>
                  <span className="text-emerald-400 font-bold">● OPERATIONAL</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-950/60 rounded border border-slate-800">
                  <span className="text-slate-400">CONFORMANCE TESTS</span>
                  <span className="text-teal-400 font-bold">11 / 11 PASS</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demo Mode Banner */}
        {state.demoMode && (
          <div className="demo-banner px-5 py-2 flex items-center gap-3 text-xs text-amber-400/80">
            <FlaskConical size={12} />
            <span className="font-semibold">DEMO MODE ACTIVE</span>
            <span className="text-amber-400/50">— All credentials are SYNTHETIC DEMONSTRATION DATA. Not official documents.</span>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
