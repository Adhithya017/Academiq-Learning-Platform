import { Sparkles } from 'lucide-react';

export default function AITip({ tip, type = 'info' }) {
  const colors = {
    info: 'from-purple-500/15 to-violet-500/10 border-purple-500/30 text-purple-200',
    success: 'from-emerald-500/15 to-green-500/10 border-emerald-500/30 text-emerald-200',
    warning: 'from-amber-500/15 to-yellow-500/10 border-amber-500/30 text-amber-200',
    danger: 'from-red-500/15 to-red-600/10 border-red-500/30 text-red-200',
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r ${colors[type]} border backdrop-blur-sm`}>
      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles className="w-4 h-4 text-purple-300" />
      </div>
      <div>
        <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">AI Insight</p>
        <p className="text-sm leading-relaxed">{tip}</p>
      </div>
    </div>
  );
}
