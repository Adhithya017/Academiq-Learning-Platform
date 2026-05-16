import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Toast, { useToast } from '../components/Toast';
import { BarChartBox, LineChartBox, DonutChart } from '../components/ChartBox';
import { teacherAPI, attendanceAPI, assignmentsAPI, analyticsAPI } from '../services/api';
import { Users, BookOpen, TrendingUp, AlertTriangle, Award, CalendarDays, ClipboardList, Star, Plus, Save, Sparkles } from 'lucide-react';

const TABS = ['overview', 'attendance', 'assignments', 'marks'];

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState(null);
  const [atRisk, setAtRisk] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [riskDist, setRiskDist] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Attendance
  const [attCourse, setAttCourse] = useState('');
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));
  const [attRecords, setAttRecords] = useState([]);
  const [attLoading, setAttLoading] = useState(false);
  const [attSaving, setAttSaving] = useState(false);

  // Assignments
  const [asgCourse, setAsgCourse] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [asgModal, setAsgModal] = useState(false);
  const [asgForm, setAsgForm] = useState({ title: '', description: '', max_score: 100, due_date: '' });

  // Marks
  const [markAsg, setMarkAsg] = useState('');
  const [markRecords, setMarkRecords] = useState([]);
  const [markSaving, setMarkSaving] = useState(false);

  const { toasts, toast, removeToast } = useToast();

  useEffect(() => {
    Promise.allSettled([
      teacherAPI.getDashboard(),
      teacherAPI.getAtRiskStudents(),
      teacherAPI.getClassPerformance(),
      analyticsAPI.getRiskDistribution(),
      teacherAPI.getMyCourses(),
    ]).then(([m, ar, perf, rd, mc]) => {
      if (m.status === 'fulfilled') setMetrics(m.value);
      if (ar.status === 'fulfilled') setAtRisk(ar.value.slice(0, 8));
      if (perf.status === 'fulfilled' && perf.value.length > 0) setPerformance(perf.value);
      if (rd.status === 'fulfilled') setRiskDist(rd.value);
      if (mc.status === 'fulfilled') setMyCourses(mc.value);
    }).finally(() => setLoading(false));
  }, []);

  // Load attendance
  const loadAttendance = async () => {
    if (!attCourse || !attDate) return;
    setAttLoading(true);
    try {
      const [records, suggestions] = await Promise.all([
        attendanceAPI.getForDate(attCourse, attDate),
        attendanceAPI.getEngagementSuggestions(attCourse)
      ]);
      
      const suggMap = {};
      suggestions.forEach(s => {
        suggMap[s.student_id] = s;
      });

      setAttRecords(records.map(r => ({
        ...r,
        is_present: r.is_present ?? true,
        suggestion: suggMap[r.student_id]?.suggestion || null,
        suggested_present: suggMap[r.student_id]?.suggested_present || false,
        engagement_score: suggMap[r.student_id]?.engagement_score || 0
      })));
    } catch { toast('Failed to load attendance', 'error'); }
    setAttLoading(false);
  };

  const applyAISuggestions = () => {
    setAttRecords(prev => prev.map(r => ({
      ...r,
      is_present: r.suggested_present
    })));
    toast('AI suggestions applied', 'success');
  };

  const saveAttendance = async () => {
    setAttSaving(true);
    try {
      await attendanceAPI.saveBulk({
        course_id: +attCourse,
        date: attDate,
        records: attRecords.map(r => ({ student_id: r.student_id, is_present: r.is_present })),
      });
      toast('Attendance saved!', 'success');
    } catch { toast('Save failed', 'error'); }
    setAttSaving(false);
  };

  // Load assignments
  useEffect(() => {
    if (asgCourse) assignmentsAPI.getCourseAssignments(asgCourse).then(setAssignments).catch(() => {});
  }, [asgCourse]);

  const createAssignment = async () => {
    try {
      const a = await assignmentsAPI.create({ ...asgForm, course_id: +asgCourse, max_score: +asgForm.max_score });
      setAssignments(prev => [a, ...prev]);
      setAsgModal(false);
      setAsgForm({ title: '', description: '', max_score: 100, due_date: '' });
      toast('Assignment created', 'success');
    } catch (e) { toast(e.response?.data?.detail || 'Error', 'error'); }
  };

  const deleteAssignment = async (id) => {
    if (!confirm('Delete assignment?')) return;
    try { await assignmentsAPI.delete(id); setAssignments(prev => prev.filter(a => a.id !== id)); toast('Deleted', 'success'); }
    catch { toast('Error', 'error'); }
  };

  // Load marks
  useEffect(() => {
    if (markAsg) assignmentsAPI.getMarks(markAsg).then(r => setMarkRecords(r.map(m => ({ ...m, _score: m.score ?? '', _feedback: m.feedback ?? '' })))).catch(() => {});
  }, [markAsg]);

  const saveMarks = async () => {
    setMarkSaving(true);
    const asgId = +markAsg;
    try {
      await assignmentsAPI.saveBulkMarks({
        assignment_id: asgId,
        marks: markRecords.filter(r => r._score !== '').map(r => ({
          student_id: r.student_id, score: +r._score, feedback: r._feedback || null
        })),
      });
      toast('Marks saved!', 'success');
    } catch { toast('Save failed', 'error'); }
    setMarkSaving(false);
  };

  const m = metrics || { total_students: 0, active_courses: 0, avg_class_score: 0, avg_attendance: 0, at_risk_count: 0, assignments_graded: 0 };
  const perfData = performance.length > 0 ? performance : [{ month: 'May', avg: 79, top: 96 }];
  const distData = riskDist.length > 0 ? riskDist : [{ name: 'Low Risk', value: 68 }, { name: 'Medium Risk', value: 22 }, { name: 'High Risk', value: 10 }];
  const inp = "bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400";
  const selectInp = "bg-slate-900 text-white font-medium placeholder:text-purple-300 border border-purple-500/40 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50";

  return (
    <Layout title="Teacher Dashboard">
      <div className="space-y-5 max-w-7xl">
        <Toast toasts={toasts} removeToast={removeToast} />

        <div className="glass-card p-5" style={{ background: 'linear-gradient(135deg,rgba(109,40,217,.25),rgba(236,72,153,.1))' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Classroom Intelligence Center</h2>
              <p className="text-purple-300/70 text-sm">AI-powered insights across your courses</p>
            </div>
            <div className="flex gap-3">
              <div className="text-center px-4 py-2 rounded-xl bg-purple-500/15 border border-purple-500/25"><p className="text-xl font-bold text-gradient">{m.total_students}</p><p className="text-xs text-purple-400">Students</p></div>
              <div className="text-center px-4 py-2 rounded-xl bg-pink-500/15 border border-pink-500/25"><p className="text-xl font-bold text-pink-300">{m.active_courses}</p><p className="text-xs text-pink-400">Courses</p></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all capitalize ${activeTab === t ? 'bg-purple-600 text-white' : 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Avg Class Score', value: `${m.avg_class_score?.toFixed(1)}%`, icon: TrendingUp },
                { label: 'At-Risk Students', value: m.at_risk_count, icon: AlertTriangle },
                { label: 'Avg Attendance', value: `${m.avg_attendance?.toFixed(1)}%`, icon: Users },
                { label: 'Assignments Graded', value: m.assignments_graded, icon: Award },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="glass-card p-4"><Icon className="w-5 h-5 text-purple-400 mb-2" /><p className="text-xl font-bold text-white">{loading ? '—' : value}</p><p className="text-xs text-purple-400/60 mt-0.5">{label}</p></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 glass-card p-5"><h3 className="section-title mb-3">Class Performance Over Time</h3><LineChartBox data={perfData} dataKeys={['avg', 'top']} xKey="month" height={200} /></div>
              <div className="glass-card p-5"><h3 className="section-title mb-3">Risk Distribution</h3><DonutChart data={distData} height={200} /></div>
            </div>
            <div className="glass-card p-5">
              <h3 className="section-title mb-4">⚠ AI-Flagged At-Risk Students</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-purple-500/15">{['Student', 'Course', 'Risk %', 'Attendance', 'Action'].map(h => <th key={h} className="text-left pb-2 text-purple-400/70 font-medium text-xs uppercase tracking-wider">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {(atRisk.length > 0 ? atRisk : []).map(s => (
                      <tr key={s.student_id} className="hover:bg-purple-500/5">
                        <td className="py-2.5 text-white">{s.full_name}</td>
                        <td className="py-2.5 text-purple-300 text-xs">{s.course_name}</td>
                        <td className="py-2.5"><span style={{ color: s.risk_score > 70 ? '#fca5a5' : '#fcd34d' }}>{s.risk_score?.toFixed(1)}%</span></td>
                        <td className="py-2.5 text-purple-300">{s.attendance_pct?.toFixed(1)}%</td>
                        <td className="py-2.5"><span className={`badge ${s.risk_level === 'High' ? 'badge-danger' : 'badge-warning'}`}>{s.action}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Attendance */}
        {activeTab === 'attendance' && (
          <div className="glass-card p-5 space-y-4">
            <h3 className="section-title flex items-center gap-2"><CalendarDays className="w-4 h-4" />Mark Attendance</h3>
            <div className="flex gap-3 flex-wrap">
              <select value={attCourse} onChange={e => setAttCourse(e.target.value)} className={selectInp}>
                <option value="">Select course...</option>
                {myCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <input type="date" value={attDate} onChange={e => setAttDate(e.target.value)} className={inp} />
              <button onClick={loadAttendance} disabled={!attCourse} className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-500 disabled:opacity-40">Load Students</button>
            </div>
            {attLoading && <p className="text-purple-400 text-sm">Loading...</p>}
            {attRecords.length > 0 && (
              <>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {attRecords.map((r, i) => (
                    <div key={r.student_id} className="flex items-center justify-between p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm font-medium">{r.full_name}</p>
                          {r.suggestion && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md border ${r.suggestion === 'Virtual Present' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-orange-500/20 text-orange-300 border-orange-500/30'}`} title={`Engagement Score: ${r.engagement_score}%`}>
                              AI: {r.suggestion}
                            </span>
                          )}
                        </div>
                        <p className="text-purple-400 text-xs">{r.roll_number}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setAttRecords(prev => prev.map((x, j) => j === i ? { ...x, is_present: true } : x))}
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${r.is_present ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-purple-500/10 text-purple-400'}`}>Present</button>
                        <button onClick={() => setAttRecords(prev => prev.map((x, j) => j === i ? { ...x, is_present: false } : x))}
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${!r.is_present ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-purple-500/10 text-purple-400'}`}>Absent</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4">
                    <p className="text-purple-400 text-sm">{attRecords.filter(r => r.is_present).length}/{attRecords.length} present</p>
                    <button onClick={applyAISuggestions} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs hover:bg-indigo-500/30 border border-indigo-500/30 transition-colors">
                      <Sparkles className="w-3.5 h-3.5" /> Apply AI Suggestions
                    </button>
                  </div>
                  <button onClick={saveAttendance} disabled={attSaving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500 disabled:opacity-40 transition-colors">
                    <Save className="w-4 h-4" />{attSaving ? 'Saving...' : 'Save Attendance'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Assignments */}
        {activeTab === 'assignments' && (
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="section-title flex items-center gap-2"><ClipboardList className="w-4 h-4" />Assignments</h3>
              {asgCourse && <button onClick={() => setAsgModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-500"><Plus className="w-4 h-4" />New</button>}
            </div>
            <select value={asgCourse} onChange={e => setAsgCourse(e.target.value)} className={`${selectInp} max-w-xs`}>
              <option value="">Select course...</option>
              {myCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            {asgCourse && (
              <div className="space-y-2">
                {assignments.length === 0 ? <p className="text-purple-400/60 text-sm">No assignments yet.</p> : assignments.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                    <div>
                      <p className="text-white text-sm font-medium">{a.title}</p>
                      <p className="text-purple-400 text-xs">Max: {a.max_score} pts • Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No deadline'}</p>
                    </div>
                    <button onClick={() => deleteAssignment(a.id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10">Delete</button>
                  </div>
                ))}
              </div>
            )}
            <Modal isOpen={asgModal} onClose={() => setAsgModal(false)} title="New Assignment">
              {['title', 'description'].map(k => (
                <div key={k} className="mb-3"><label className="block text-xs text-purple-400 mb-1 capitalize">{k}</label>
                  <input value={asgForm[k]} onChange={e => setAsgForm(f => ({ ...f, [k]: e.target.value }))} className={`${inp} w-full`} /></div>
              ))}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><label className="block text-xs text-purple-400 mb-1">Max Score</label><input type="number" value={asgForm.max_score} onChange={e => setAsgForm(f => ({ ...f, max_score: e.target.value }))} className={`${inp} w-full`} /></div>
                <div><label className="block text-xs text-purple-400 mb-1">Due Date</label><input type="datetime-local" value={asgForm.due_date} onChange={e => setAsgForm(f => ({ ...f, due_date: e.target.value }))} className={`${inp} w-full`} /></div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={createAssignment} className="flex-1 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-500">Create</button>
                <button onClick={() => setAsgModal(false)} className="flex-1 py-2 rounded-lg bg-purple-500/10 text-purple-300 text-sm">Cancel</button>
              </div>
            </Modal>
          </div>
        )}

        {/* Marks */}
        {activeTab === 'marks' && (
          <div className="glass-card p-5 space-y-4">
            <h3 className="section-title flex items-center gap-2"><Star className="w-4 h-4" />Enter Marks</h3>
            <div className="flex gap-3 flex-wrap">
              <select value={asgCourse} onChange={e => { setAsgCourse(e.target.value); setMarkAsg(''); }} className={selectInp}>
                <option value="">Select course...</option>
                {myCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              {asgCourse && (
                <select value={markAsg} onChange={e => setMarkAsg(e.target.value)} className={selectInp}>
                  <option value="">Select assignment...</option>
                  {assignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
              )}
            </div>
            {markRecords.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-purple-500/15">{['Student', 'Roll', 'Score', 'Feedback'].map(h => <th key={h} className="text-left pb-2 text-purple-400/70 font-medium text-xs uppercase tracking-wider">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-purple-500/10">
                      {markRecords.map((r, i) => (
                        <tr key={r.student_id} className="hover:bg-purple-500/5">
                          <td className="py-2 text-white">{r.full_name}</td>
                          <td className="py-2 text-purple-300 text-xs">{r.roll_number}</td>
                          <td className="py-2 w-28"><input type="number" value={r._score} min={0} max={r.max_score}
                            onChange={e => setMarkRecords(prev => prev.map((x, j) => j === i ? { ...x, _score: e.target.value } : x))}
                            className={`${inp} w-full text-center`} placeholder={`/${r.max_score}`} /></td>
                          <td className="py-2"><input value={r._feedback}
                            onChange={e => setMarkRecords(prev => prev.map((x, j) => j === i ? { ...x, _feedback: e.target.value } : x))}
                            className={`${inp} w-full`} placeholder="Optional feedback..." /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end">
                  <button onClick={saveMarks} disabled={markSaving} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500 disabled:opacity-40">
                    <Save className="w-4 h-4" />{markSaving ? 'Saving...' : 'Save All Marks'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
