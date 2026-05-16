import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { analyticsAPI } from '../services/api';
import { Trophy, Medal, TrendingUp, Users, Activity, Star } from 'lucide-react';

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_EMOJIS = ['🥇', '🥈', '🥉'];
const RISK_BADGE = {
  Low: 'badge-success',
  Medium: 'badge-warning',
  High: 'badge-danger',
};

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getLeaderboard(20)
      .then(setData)
      .catch(() => {
        // Fallback demo data
        setData([
          { rank: 1, student_id: 1, full_name: 'Aditi Rao', roll_number: 'CS2021001', department: 'Computer Science', avg_score: 96.4, attendance_pct: 98, gpa: 3.9, risk_level: 'Low' },
          { rank: 2, student_id: 2, full_name: 'Sri Krishnan', roll_number: 'CS2021006', department: 'Data Science', avg_score: 93.2, attendance_pct: 95, gpa: 3.8, risk_level: 'Low' },
          { rank: 3, student_id: 3, full_name: 'Neel Shah', roll_number: 'CS2021007', department: 'Computer Science', avg_score: 91.8, attendance_pct: 92, gpa: 3.7, risk_level: 'Low' },
          { rank: 4, student_id: 4, full_name: 'Ananya Iyer', roll_number: 'CS2021008', department: 'Software Engineering', avg_score: 88.5, attendance_pct: 90, gpa: 3.6, risk_level: 'Low' },
          { rank: 5, student_id: 5, full_name: 'Sneha Reddy', roll_number: 'CS2021010', department: 'Computer Science', avg_score: 85.3, attendance_pct: 88, gpa: 3.5, risk_level: 'Low' },
          { rank: 6, student_id: 6, full_name: 'Meera Pillai', roll_number: 'CS2021012', department: 'Data Science', avg_score: 82.1, attendance_pct: 85, gpa: 3.4, risk_level: 'Low' },
          { rank: 7, student_id: 7, full_name: 'Deepa Nair', roll_number: 'CS2021016', department: 'Software Engineering', avg_score: 79.6, attendance_pct: 83, gpa: 3.3, risk_level: 'Medium' },
          { rank: 8, student_id: 8, full_name: 'Pooja Joshi', roll_number: 'CS2021014', department: 'Computer Science', avg_score: 76.2, attendance_pct: 80, gpa: 3.1, risk_level: 'Medium' },
          { rank: 9, student_id: 9, full_name: 'Arjun Nair', roll_number: 'CS2021011', department: 'Data Science', avg_score: 72.8, attendance_pct: 77, gpa: 2.9, risk_level: 'Medium' },
          { rank: 10, student_id: 10, full_name: 'Isha Verma', roll_number: 'CS2021018', department: 'Software Engineering', avg_score: 69.4, attendance_pct: 74, gpa: 2.8, risk_level: 'Medium' },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? data :
    data.filter(s => s.department.toLowerCase().includes(filter.toLowerCase()));

  const departments = [...new Set(data.map(s => s.department))].filter(Boolean);

  const topThree = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  return (
    <Layout title="Student Leaderboard">
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <div className="glass-card p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(139,92,246,0.2) 100%)' }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #FFD700, transparent)', right: '-20px', top: '-20px' }} />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-glow">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Academic Leaderboard</h2>
              <p className="text-purple-300/70">Ranked by overall performance score & consistency</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Total Students', value: data.length, color: 'text-purple-400' },
            { icon: Star, label: 'Avg Score', value: data.length > 0 ? `${(data.reduce((s, d) => s + d.avg_score, 0) / data.length).toFixed(1)}%` : '—', color: 'text-amber-400' },
            { icon: Activity, label: 'Avg Attendance', value: data.length > 0 ? `${(data.reduce((s, d) => s + d.attendance_pct, 0) / data.length).toFixed(1)}%` : '—', color: 'text-cyan-400' },
            { icon: TrendingUp, label: 'High Performers', value: data.filter(d => d.avg_score >= 85).length, color: 'text-emerald-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="glass-card p-4 flex items-center gap-3">
              <Icon className={`w-7 h-7 ${color}`} />
              <div>
                <p className="text-white font-bold text-lg">{loading ? '—' : value}</p>
                <p className="text-purple-400/60 text-xs">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Department Filter */}
        <div className="flex gap-2 flex-wrap">
          {['all', ...departments].map((d) => (
            <button key={d} onClick={() => setFilter(d)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === d ? 'bg-purple-600 text-white shadow-glow' : 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'}`}>
              {d === 'all' ? 'All Departments' : d}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        {topThree.length >= 3 && (
          <div className="grid grid-cols-3 gap-4">
            {/* 2nd Place */}
            <div className="glass-card p-5 text-center mt-4" style={{ border: '1px solid rgba(192,192,192,0.3)' }}>
              <p className="text-5xl mb-3">🥈</p>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                {topThree[1]?.full_name?.charAt(0)}
              </div>
              <p className="text-white font-bold">{topThree[1]?.full_name}</p>
              <p className="text-purple-400/60 text-xs">{topThree[1]?.roll_number}</p>
              <p className="text-2xl font-black text-gray-300 mt-2">{topThree[1]?.avg_score?.toFixed(1)}%</p>
              <span className="badge-success mt-2 inline-flex">GPA {topThree[1]?.gpa?.toFixed(1)}</span>
            </div>

            {/* 1st Place */}
            <div className="glass-card p-5 text-center -mt-2"
              style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(251,191,36,0.4)' }}>
              <p className="text-5xl mb-3">🥇</p>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 shadow-glow">
                {topThree[0]?.full_name?.charAt(0)}
              </div>
              <p className="text-white font-bold text-lg">{topThree[0]?.full_name}</p>
              <p className="text-purple-400/60 text-xs">{topThree[0]?.roll_number}</p>
              <p className="text-3xl font-black text-gradient mt-2">{topThree[0]?.avg_score?.toFixed(1)}%</p>
              <span className="badge-success mt-2 inline-flex">GPA {topThree[0]?.gpa?.toFixed(1)}</span>
            </div>

            {/* 3rd Place */}
            <div className="glass-card p-5 text-center mt-4" style={{ border: '1px solid rgba(205,127,50,0.3)' }}>
              <p className="text-5xl mb-3">🥉</p>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                {topThree[2]?.full_name?.charAt(0)}
              </div>
              <p className="text-white font-bold">{topThree[2]?.full_name}</p>
              <p className="text-purple-400/60 text-xs">{topThree[2]?.roll_number}</p>
              <p className="text-2xl font-black text-amber-400 mt-2">{topThree[2]?.avg_score?.toFixed(1)}%</p>
              <span className="badge-success mt-2 inline-flex">GPA {topThree[2]?.gpa?.toFixed(1)}</span>
            </div>
          </div>
        )}

        {/* Full Table */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="section-title">Complete Rankings</h3>
            <span className="badge-info">{filtered.length} students</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-purple-500/15">
                  {['Rank', 'Student', 'Dept', 'Avg Score', 'Attendance', 'GPA', 'Risk Level'].map(h => (
                    <th key={h} className="text-left pb-3 text-purple-400/70 font-medium text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/10">
                {filtered.map((s) => (
                  <tr key={s.student_id} className={`hover:bg-purple-500/5 transition-colors ${s.rank <= 3 ? 'bg-purple-500/5' : ''}`}>
                    <td className="py-3">
                      {s.rank <= 3 ? (
                        <span className="text-2xl">{RANK_EMOJIS[s.rank - 1]}</span>
                      ) : (
                        <span className="text-purple-300 font-bold">#{s.rank}</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ background: s.rank <= 3 ? `linear-gradient(135deg, ${RANK_COLORS[s.rank - 1]}, ${RANK_COLORS[s.rank - 1]}88)` : 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                          {s.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-semibold">{s.full_name}</p>
                          <p className="text-purple-400/60 text-xs">{s.roll_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-purple-300 text-xs">{s.department}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-purple-500/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full"
                            style={{ width: `${s.avg_score}%` }} />
                        </div>
                        <span className="text-white font-bold">{s.avg_score?.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-purple-300">{s.attendance_pct?.toFixed(1)}%</td>
                    <td className="py-3 text-white font-bold">{s.gpa?.toFixed(2)}</td>
                    <td className="py-3">
                      <span className={RISK_BADGE[s.risk_level] || 'badge-info'}>{s.risk_level}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
