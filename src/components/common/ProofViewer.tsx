import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  data: unknown;
  title?: string;
  className?: string;
  defaultExpanded?: boolean;
}

function JsonNode({ data, depth = 0 }: { data: unknown; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (data === null) return <span className="text-slate-500">null</span>;
  if (typeof data === 'boolean') return <span className="text-blue-400">{String(data)}</span>;
  if (typeof data === 'number') return <span className="text-teal-300">{data}</span>;
  if (typeof data === 'string') {
    // Truncate long strings
    const display = data.length > 60 ? data.substring(0, 60) + '...' : data;
    return <span className="text-amber-300">"{display}"</span>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-slate-400">[]</span>;
    return (
      <span>
        <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-slate-200">
          {expanded ? '[' : `[…${data.length}]`}
        </button>
        {expanded && (
          <>
            <div style={{ marginLeft: (depth + 1) * 16 }}>
              {data.map((item, i) => (
                <div key={i}>
                  <JsonNode data={item} depth={depth + 1} />
                  {i < data.length - 1 && <span className="text-slate-600">,</span>}
                </div>
              ))}
            </div>
            <span className="text-slate-400">]</span>
          </>
        )}
      </span>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-slate-400">{'{}'}</span>;
    return (
      <span>
        <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-slate-200 inline-flex items-center">
          {expanded ? <ChevronDown size={12} className="mr-1" /> : <ChevronRight size={12} className="mr-1" />}
          {expanded ? '{' : `{…${entries.length}}`}
        </button>
        {expanded && (
          <>
            <div style={{ marginLeft: (depth + 1) * 16 }}>
              {entries.map(([k, v], i) => (
                <div key={k}>
                  <span className="text-indigo-300">"{k}"</span>
                  <span className="text-slate-500">: </span>
                  <JsonNode data={v} depth={depth + 1} />
                  {i < entries.length - 1 && <span className="text-slate-600">,</span>}
                </div>
              ))}
            </div>
            <span className="text-slate-400">{'}'}</span>
          </>
        )}
      </span>
    );
  }

  return <span className="text-slate-300">{String(data)}</span>;
}

export default function ProofViewer({ data, title, className = '', defaultExpanded = true }: Props) {
  return (
    <div className={`code-block ${className}`}>
      {title && <div className="text-slate-500 text-[10px] uppercase tracking-widest mb-3">{title}</div>}
      <div className="text-sm leading-relaxed">
        <JsonNode data={data} depth={0} />
      </div>
    </div>
  );
}
