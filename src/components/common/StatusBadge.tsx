import React from 'react';
import type { ProtocolStatus, VerificationOutcome } from '../../types';

interface Props {
  status: ProtocolStatus | VerificationOutcome | string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  VERIFIED:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  REGISTERED:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
  REVOKED:      'bg-red-500/15 text-red-400 border-red-500/30',
  REJECTED:     'bg-red-500/15 text-red-400 border-red-500/30',
  SUSPENDED:    'bg-orange-500/15 text-orange-400 border-orange-500/30',
  EXPIRED:      'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  PENDING:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
  UNREGISTERED: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  INVALID:      'bg-red-500/15 text-red-400 border-red-500/30',
  VALID:        'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  NOT_REVOKED:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  SUCCESS:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  FAILURE:      'bg-red-500/15 text-red-400 border-red-500/30',
};

const DOT_COLORS: Record<string, string> = {
  ACTIVE:       'bg-emerald-400',
  VERIFIED:     'bg-emerald-400',
  REGISTERED:   'bg-blue-400',
  REVOKED:      'bg-red-400',
  REJECTED:     'bg-red-400',
  SUSPENDED:    'bg-orange-400',
  EXPIRED:      'bg-yellow-400',
  PENDING:      'bg-blue-400',
  UNREGISTERED: 'bg-slate-400',
  INVALID:      'bg-red-400',
  VALID:        'bg-emerald-400',
  NOT_REVOKED:  'bg-emerald-400',
  SUCCESS:      'bg-emerald-400',
  FAILURE:      'bg-red-400',
};

const SIZES = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export default function StatusBadge({ status, size = 'sm', pulse = false }: Props) {
  const style = STATUS_STYLES[status] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  const dotColor = DOT_COLORS[status] ?? 'bg-slate-400';

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono font-semibold border rounded ${SIZES[size]} ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${pulse ? 'animate-pulse' : ''}`} />
      {status}
    </span>
  );
}
