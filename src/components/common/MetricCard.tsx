import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'teal' | 'emerald' | 'red' | 'orange' | 'yellow' | 'blue' | 'indigo' | 'slate';
  trend?: { value: number; label: string };
}

const COLOR_STYLES = {
  teal:    { bg: 'bg-teal-500/10', border: 'border-teal-500/20', icon: 'text-teal-400', value: 'text-teal-300' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400', value: 'text-emerald-300' },
  red:     { bg: 'bg-red-500/10', border: 'border-red-500/20', icon: 'text-red-400', value: 'text-red-300' },
  orange:  { bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: 'text-orange-400', value: 'text-orange-300' },
  yellow:  { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: 'text-yellow-400', value: 'text-yellow-300' },
  blue:    { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'text-blue-400', value: 'text-blue-300' },
  indigo:  { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: 'text-indigo-400', value: 'text-indigo-300' },
  slate:   { bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: 'text-slate-400', value: 'text-slate-300' },
};

export default function MetricCard({ title, value, subtitle, icon: Icon, color = 'teal', trend }: Props) {
  const styles = COLOR_STYLES[color];

  return (
    <div className={`glass-card p-5 flex flex-col gap-3 hover:border-slate-600/50 transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${styles.bg} border ${styles.border}`}>
          <Icon size={18} className={styles.icon} />
        </div>
        {trend && (
          <div className={`text-[11px] font-medium ${trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </div>
        )}
      </div>

      <div>
        <div className={`text-2xl font-bold font-mono ${styles.value}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div className="text-xs text-slate-500 mt-0.5 uppercase tracking-wide">{title}</div>
        {subtitle && <div className="text-[10px] text-slate-600 mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}
