import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  rid: string;
  label?: string;
  showFull?: boolean;
  className?: string;
}

export default function RIDDisplay({ rid, label, showFull = false, className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  const display = showFull ? rid : (rid.length > 40 ? rid.substring(0, 32) + '...' + rid.slice(-8) : rid);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group ${className}`}>
      {label && <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">{label}</div>}
      <div className="flex items-center gap-2">
        <code className="text-[11px] font-mono text-indigo-300/80 bg-indigo-500/5 border border-indigo-500/15 rounded px-2 py-1 break-all leading-relaxed flex-1">
          {display}
        </code>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-all opacity-0 group-hover:opacity-100"
        >
          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  );
}
