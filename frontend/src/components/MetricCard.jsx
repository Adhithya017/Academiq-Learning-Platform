export default function MetricCard({ title, value, subtitle, icon: Icon, color = 'purple', trend }) {
  const colorMap = {
    purple: { bg: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/25', icon: 'text-purple-400', iconBg: 'bg-purple-500/20' },
    pink: { bg: 'from-pink-500/20 to-pink-600/10', border: 'border-pink-500/25', icon: 'text-pink-400', iconBg: 'bg-pink-500/20' },
    cyan: { bg: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/25', icon: 'text-cyan-400', iconBg: 'bg-cyan-500/20' },
    green: { bg: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/25', icon: 'text-emerald-400', iconBg: 'bg-emerald-500/20' },
    orange: { bg: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/25', icon: 'text-amber-400', iconBg: 'bg-amber-500/20' },
    red: { bg: 'from-red-500/20 to-red-600/10', border: 'border-red-500/25', icon: 'text-red-400', iconBg: 'bg-red-500/20' },
  };
  const c = colorMap[color] || colorMap.purple;

  return (
    <div className={`rounded-2xl p-5 bg-gradient-to-br ${c.bg} border ${c.border} backdrop-blur-sm shadow-glass transition-all duration-300 hover:shadow-glass-hover hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center`}>
          {Icon && <Icon className={`w-6 h-6 ${c.icon}`} />}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-purple-300/70 font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        {subtitle && <p className="text-xs text-purple-400/60 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
