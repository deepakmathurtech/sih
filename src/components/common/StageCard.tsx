import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import type { VerificationStage, StageStatus } from '../../types';

interface Props {
  stage: VerificationStage;
  isActive?: boolean;
  style?: React.CSSProperties;
}

const STATUS_ICONS: Record<StageStatus, React.ReactNode> = {
  pending:  <div className="w-5 h-5 rounded-full border-2 border-slate-600" />,
  running:  <Loader size={20} className="text-blue-400 animate-spin" />,
  pass:     <CheckCircle size={20} className="text-emerald-400" />,
  fail:     <XCircle size={20} className="text-red-400" />,
  skipped:  <div className="w-5 h-5 rounded-full border-2 border-slate-700 bg-slate-800" />,
};

const STATUS_BORDER: Record<StageStatus, string> = {
  pending:  'border-slate-700/50',
  running:  'border-blue-500/40',
  pass:     'border-emerald-500/40',
  fail:     'border-red-500/40',
  skipped:  'border-slate-700/30',
};

const STATUS_BG: Record<StageStatus, string> = {
  pending:  'bg-slate-900/40',
  running:  'bg-blue-500/5',
  pass:     'bg-emerald-500/5',
  fail:     'bg-red-500/5',
  skipped:  'bg-slate-900/20',
};

export default function StageCard({ stage, isActive, style }: Props) {
  const [expanded, setExpanded] = useState(stage.status === 'fail');

  const hasDetails = Object.keys(stage.details).length > 0 || stage.technicalInfo;

  return (
    <div
      className={`stage-enter border rounded-lg transition-all ${STATUS_BORDER[stage.status]} ${STATUS_BG[stage.status]} ${isActive ? 'ring-1 ring-blue-500/30' : ''}`}
      style={style}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 ${hasDetails ? 'cursor-pointer' : ''}`}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        {/* Step number */}
        <span className="text-[10px] font-mono text-slate-600 w-5 text-center flex-shrink-0">
          {stage.stepNumber.toString().padStart(2, '0')}
        </span>

        {/* Status icon */}
        <div className="flex-shrink-0">{STATUS_ICONS[stage.status]}</div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-200">{stage.name}</div>
          <div className="text-xs text-slate-500">{stage.description}</div>
        </div>

        {/* Latency */}
        {stage.status !== 'pending' && stage.status !== 'running' && (
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono flex-shrink-0">
            <Clock size={10} />
            {stage.latencyMs.toFixed(2)}ms
          </div>
        )}

        {/* Error code */}
        {stage.errorCode && (
          <span className="text-[10px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded flex-shrink-0">
            {stage.errorCode}
          </span>
        )}

        {/* Expand */}
        {hasDetails && (
          <div className="text-slate-600 flex-shrink-0">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        )}
      </div>

      {/* Expanded details */}
      {expanded && hasDetails && (
        <div className="px-4 pb-3 border-t border-slate-800/40 mt-0">
          <div className="pt-3 space-y-2">
            {/* Key-value details */}
            {Object.entries(stage.details).map(([k, v]) => (
              <div key={k} className="flex items-start gap-2">
                <span className="text-[10px] font-mono text-slate-500 w-36 flex-shrink-0 pt-0.5">{k}:</span>
                <span className={`text-[11px] font-mono ${
                  v === true ? 'text-emerald-400' :
                  v === false ? 'text-red-400' :
                  typeof v === 'number' ? 'text-teal-300' :
                  'text-slate-300'
                }`}>
                  {String(v)}
                </span>
              </div>
            ))}
            {/* Technical info */}
            {stage.technicalInfo && (
              <div className="mt-2 pt-2 border-t border-slate-800/40">
                <div className="text-[10px] text-slate-500 leading-relaxed">{stage.technicalInfo}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
