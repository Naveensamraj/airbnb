import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'slate';
  prefix?: string;
}

const colorMap = {
  blue: { icon: 'bg-blue-100 text-blue-600', border: 'border-blue-100' },
  emerald: { icon: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-100' },
  amber: { icon: 'bg-amber-100 text-amber-600', border: 'border-amber-100' },
  red: { icon: 'bg-red-100 text-red-600', border: 'border-red-100' },
  slate: { icon: 'bg-slate-100 text-slate-600', border: 'border-slate-100' },
};

export default function StatCard({ title, value, icon: Icon, trend, trendLabel, color = 'blue', prefix }: StatCardProps) {
  const colors = colorMap[color];
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div className="card p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{isPositive ? '+' : ''}{trend}%</span>
              {trendLabel && <span className="text-slate-400 font-normal">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
