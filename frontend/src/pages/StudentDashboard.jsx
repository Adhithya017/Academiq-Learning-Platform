import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import MetricCard from '../components/MetricCard';
import AITip from '../components/AITip';
import { AreaChartBox, BarChartBox } from '../components/ChartBox';
import { studentAPI, analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Activity, BookOpen, TrendingUp, AlertTriangle, Clock, Star, CheckCircle, Target, Sparkles, ChevronRight, FileText, Brain } from 'lucide-react';

const COURSE_COLORS = ['purple', 'cyan', 'green', 'orange'];
const colorDot = { purple: '#8b5cf6', cyan: '#06b6d4', green: '#10b981', orange: '#f59e0b' };
const PRIORITY_COLOR = { critical: 'danger', high: 'warning', medium: 'info', low: 'success' };
const TABS = ['overview', 'marks', 'assignments', 'attendance', 'ai'];

export default function StudentDashboard() {
  const { user } = useAuth();
  const { studentId } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [targetStudent, setTargetStudent] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [courses, setCourses] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [marks, setMarks] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const promises = [
          studentAPI.getDashboard(studentId),
          studentAPI.getMyCourses(studentId),
          studentAPI.getMyRecommendations(studentId),
          studentAPI.getMyAttendance(studentId),
          studentAPI.getMyMarks(studentId),
          studentAPI.getMyAssignments(studentId),
          studentAPI.getMyPredictions(studentId),
        ];
        
        if (studentId) {
          promises.push(studentAPI.getById(studentId));
        }

        const [m, c, r, att, mk, asg, pred, targetProfile] = await Promise.allSettled(promises);
        
        if (m.status === 'fulfilled') setMetrics(m.value);
        if (c.status === 'fulfilled') setCourses(c.value);
        if (r.status === 'fulfilled') setRecommendations(r.value.slice(0, 4));
        if (att.status === 'fulfilled' && att.value.length > 0) {
          const first = att.value[0];
          setAttendanceData(att.value);
        }
        if (mk.status === 'fulfilled') setMarks(mk.value);
        if (asg.status === 'fulfilled') setAssignments(asg.value);
        if (pred.status === 'fulfilled') setPredictions(pred.value);
        if (studentId && targetProfile?.status === 'fulfilled') {
          setTargetStudent(targetProfile.value);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, [studentId]);

  const data = metrics || { attendance_rate: 85.5, performance_score: 78.2, courses_enrolled: 4, dropout_risk: 12.4, prediction_accuracy: 94.2, gpa: 3.4, assignments_submitted: 22, assignments_total: 28 };
  const subjectData = courses.map((c, i) => ({ subject: c.code || `C${i + 1}`, score: c.avg_score || 70 }));
  const greeting = ['Morning', 'Afternoon', 'Evening'][Math.floor(new Date().getHours() / 8)] || 'Hello';

  const riskColor = (r) => r === 'High' ? '#ef4444' : r === 'Medium' ? '#f59e0b' : '#10b981';

  return (
    <Layout title="Student Dashboard">
      <div className="space-y-5 max-w-7xl">
        {/* Welcome Banner */}
        <div className="glass-card p-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,rgba(139,92,246,.2),rgba(109,40,217,.1))' }}>
          <div>
            {studentId ? (
              <>
                <h2 className="text-xl font-bold text-white mb-0.5">Student Profile: {targetStudent?.full_name || 'Loading...'}</h2>
                <p className="text-purple-300/80 text-sm">{targetStudent?.roll_number} • {targetStudent?.department}</p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white mb-0.5">Good {greeting}, {user?.full_name?.split(' ')[0]}! 👋</h2>
                <p className="text-purple-300/80 text-sm">Your AI-powered academic insights are ready.</p>
              </>
            )}
          </div>
          <div className="hidden md:flex gap-5">
            <div className="text-center"><p className="text-2xl font-black text-gradient">{loading ? '—' : `${data.performance_score?.toFixed(0)}%`}</p><p className="text-xs text-purple-400">Performance</p></div>
            <div className="text-center"><p className="text-2xl font-black text-white">{loading ? '—' : data.gpa?.toFixed(1)}</p><p className="text-xs text-purple-400">GPA</p></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all capitalize ${activeTab === t ? 'bg-purple-600 text-white' : 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'}`}>{t === 'ai' ? 'AI Insights' : t}</button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="Attendance Rate" value={loading ? '—' : `${data.attendance_rate?.toFixed(1)}%`} icon={Activity} color="purple" trend={3.2} subtitle="Last 8 weeks" />
              <MetricCard title="Performance Score" value={loading ? '—' : `${data.performance_score?.toFixed(1)}%`} icon={TrendingUp} color="green" trend={5.1} subtitle="AI predicted" />
              <MetricCard title="Courses Enrolled" value={loading ? '—' : data.courses_enrolled} icon={BookOpen} color="cyan" subtitle="Active semester" />
              <MetricCard title="Dropout Risk" value={loading ? '—' : `${data.dropout_risk?.toFixed(1)}%`} icon={AlertTriangle} color={data.dropout_risk > 60 ? 'red' : 'orange'} subtitle={data.dropout_risk > 60 ? '⚠ High risk!' : 'Low risk'} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="glass-card p-5"><h3 className="section-title mb-3">Attendance Trend</h3>
                <AreaChartBox data={attendanceData.length > 0 ? attendanceData.map(a => ({ week: a.course_code, attendance: a.attendance_pct })) : [{ week: 'W1', attendance: 78 }, { week: 'W2', attendance: 85 }, { week: 'W3', attendance: 91 }, { week: 'W4', attendance: 88 }]} dataKey="attendance" xKey="week" color="#8b5cf6" height={180} />
              </div>
              <div className="glass-card p-5"><h3 className="section-title mb-3">Scores by Course</h3>
                <BarChartBox data={subjectData.length > 0 ? subjectData : [{ subject: 'ML', score: 88 }, { subject: 'DS', score: 74 }, { subject: 'Web', score: 92 }]} dataKeys={['score']} xKey="subject" height={180} />
              </div>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4"><h3 className="section-title">My Courses</h3><a href="/courses" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></a></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(courses.length > 0 ? courses : [{ title: 'Machine Learning 101', code: 'CS101', progress: 78, avg_score: 88 }, { title: 'Data Structures', code: 'CS102', progress: 65, avg_score: 74 }]).slice(0, 4).map((c, i) => {
                  const dot = colorDot[COURSE_COLORS[i % COURSE_COLORS.length]];
                  const score = c.avg_score || 0;
                  const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B+' : score >= 60 ? 'B' : 'C';
                  return (
                    <div key={c.code || i} className="p-4 rounded-xl bg-white/5 border border-purple-500/15 hover:border-purple-500/30 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div><p className="text-white font-semibold text-sm">{c.title}</p><p className="text-purple-400/60 text-xs">{c.code}</p></div>
                        <span className="text-lg font-bold" style={{ color: dot }}>{grade}</span>
                      </div>
                      <div className="flex justify-between text-xs text-purple-400 mb-1"><span>Attendance</span><span>{c.progress}%</span></div>
                      <div className="h-2 bg-purple-500/10 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${c.progress}%`, background: `linear-gradient(90deg,${dot},${dot}88)` }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: CheckCircle, label: 'Submitted', value: loading ? '—' : `${data.assignments_submitted}/${data.assignments_total}`, color: 'text-emerald-400' },
                { icon: Clock, label: 'Study Hrs/Week', value: '18.5h', color: 'text-cyan-400' },
                { icon: Star, label: 'GPA', value: loading ? '—' : data.gpa?.toFixed(2), color: 'text-amber-400' },
                { icon: Target, label: 'AI Accuracy', value: `${data.prediction_accuracy || 94.2}%`, color: 'text-purple-400' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="glass-card p-4 text-center"><Icon className={`w-5 h-5 ${color} mx-auto mb-2`} /><p className="text-white font-bold text-xl">{value}</p><p className="text-purple-400/60 text-xs mt-1">{label}</p></div>
              ))}
            </div>
          </div>
        )}

        {/* Marks Tab */}
        {activeTab === 'marks' && (
          <div className="glass-card p-5">
            <h3 className="section-title mb-4 flex items-center gap-2"><FileText className="w-4 h-4" />My Marks</h3>
            {marks.length === 0 ? <p className="text-purple-400/60 text-sm">No marks recorded yet.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-purple-500/15">{['Assignment', 'Course', 'Score', 'Grade %', 'Feedback'].map(h => <th key={h} className="text-left pb-2 text-purple-400/70 font-medium text-xs uppercase tracking-wider">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {marks.map(m => {
                      const pct = m.pct || 0;
                      const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : 'C';
                      const gColor = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
                      return (
                        <tr key={m.mark_id} className="hover:bg-purple-500/5">
                          <td className="py-2.5 text-white font-medium">{m.assignment_title}</td>
                          <td className="py-2.5 text-purple-300 text-xs">{m.course_title} <span className="text-purple-500">({m.course_code})</span></td>
                          <td className="py-2.5 text-white font-bold">{m.score}/{m.max_score}</td>
                          <td className="py-2.5"><div className="flex items-center gap-2"><div className="h-1.5 w-16 bg-purple-500/10 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: gColor }} /></div><span style={{ color: gColor }}>{pct}% ({grade})</span></div></td>
                          <td className="py-2.5 text-purple-400 text-xs italic">{m.feedback || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="glass-card p-5">
            <h3 className="section-title mb-4">My Assignments</h3>
            {assignments.length === 0 ? <p className="text-purple-400/60 text-sm">No assignments found.</p> : (
              <div className="space-y-3">
                {assignments.map(a => {
                  const isOverdue = a.due_date && new Date(a.due_date) < new Date() && !a.submitted;
                  return (
                    <div key={a.assignment_id} className="flex items-center justify-between p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                      <div>
                        <p className="text-white font-medium text-sm">{a.title}</p>
                        <p className="text-purple-400 text-xs">{a.course_title} • {a.due_date ? `Due: ${new Date(a.due_date).toLocaleDateString()}` : 'No deadline'}</p>
                      </div>
                      <div className="text-right">
                        {a.submitted
                          ? <><p className="text-emerald-400 text-sm font-bold">{a.score}/{a.max_score}</p><p className="text-emerald-400/70 text-xs">{a.pct}% ✓</p></>
                          : <span className={isOverdue ? 'badge-danger' : 'badge-warning'}>{isOverdue ? 'Overdue' : 'Pending'}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            {(attendanceData.length > 0 ? attendanceData : []).map(a => (
              <div key={a.course_id} className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div><p className="text-white font-semibold">{a.course_title}</p><p className="text-purple-400 text-xs">{a.course_code}</p></div>
                  <div className="text-right"><p className="text-xl font-bold" style={{ color: a.attendance_pct >= 75 ? '#10b981' : '#ef4444' }}>{a.attendance_pct}%</p><p className="text-purple-400 text-xs">{a.attended}/{a.total_classes} classes</p></div>
                </div>
                <div className="h-2 bg-purple-500/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${a.attendance_pct}%`, background: a.attendance_pct >= 75 ? '#10b981' : '#ef4444' }} />
                </div>
                {a.attendance_pct < 75 && <p className="text-red-400 text-xs mt-2">⚠ Below 75% threshold — attendance intervention required</p>}
              </div>
            ))}
            {attendanceData.length === 0 && <div className="glass-card p-5"><p className="text-purple-400/60 text-sm">No attendance data available.</p></div>}
          </div>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-5">
            {predictions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {predictions.map(p => (
                  <div key={p.id} className="glass-card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2"><Brain className="w-4 h-4 text-purple-400" /><p className="text-white font-semibold text-sm">{p.course_name}</p></div>
                      <span className="text-xs px-2 py-0.5 rounded-full border" style={{ color: riskColor(p.risk_level), borderColor: riskColor(p.risk_level) + '40', background: riskColor(p.risk_level) + '15' }}>{p.risk_level} Risk</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-2 rounded-lg bg-purple-500/10"><p className="text-white font-bold">{p.predicted_score}%</p><p className="text-purple-400 text-xs">Predicted</p></div>
                      <div className="p-2 rounded-lg bg-purple-500/10"><p className="font-bold" style={{ color: riskColor(p.risk_level) }}>{p.dropout_risk_pct}%</p><p className="text-purple-400 text-xs">Risk Score</p></div>
                      <div className="p-2 rounded-lg bg-purple-500/10"><p className="text-white font-bold">{p.confidence}%</p><p className="text-purple-400 text-xs">Confidence</p></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="glass-card p-5"><p className="text-purple-400/60 text-sm">No AI predictions available yet.</p></div>}
            {recommendations.length > 0 && (
              <div>
                <h3 className="section-title mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-400" />AI Recommendations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.map(r => <AITip key={r.id} tip={r.message} type={PRIORITY_COLOR[r.priority] || 'info'} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
