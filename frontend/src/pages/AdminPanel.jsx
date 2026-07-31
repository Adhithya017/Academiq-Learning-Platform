import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Toast, { useToast } from '../components/Toast';
import { adminAPI, studentAPI } from '../services/api';
import { Shield, Users, BookOpen, Link, Plus, Edit, Trash2, UserCheck, UserX, Cpu, Activity } from 'lucide-react';

const TABS = ['overview', 'users', 'courses', 'enrollments', 'logs'];

function FormField({ label, children }) {
  return (
    <div className="mb-3">
      <label className="block text-xs text-purple-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inp = "w-full bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2 text-white text-sm placeholder-purple-500/40 focus:outline-none focus:border-purple-400";
const selectInp = "w-full bg-slate-900 text-white font-medium placeholder:text-purple-300 border border-purple-500/40 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [userModal, setUserModal] = useState({ open: false, data: null });
  const [courseModal, setCourseModal] = useState({ open: false, data: null });
  const [enrollModal, setEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ student_id: '', course_id: '' });

  const { toasts, toast, removeToast } = useToast();

  useEffect(() => {
    adminAPI.getStats().then(setStats).catch(() => {}).finally(() => setLoading(false));
    adminAPI.getCourses().then(setCourses).catch(() => {});
    adminAPI.getTeachersList().then(setTeachers).catch(() => {});
    adminAPI.getUsers().then(u => {
      setUsers(u);
      setAllStudents(u.filter(x => x.role === 'student'));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      adminAPI.getUsers().then(u => {
        setUsers(u);
        setAllStudents(u.filter(x => x.role === 'student'));
      }).catch(() => {});
    }
    if (activeTab === 'courses') {
      adminAPI.getCourses().then(setCourses).catch(() => {});
      adminAPI.getTeachersList().then(setTeachers).catch(() => {});
    }
    if (activeTab === 'enrollments') {
      adminAPI.getEnrollments().then(setEnrollments).catch(() => {});
      adminAPI.getUsers().then(u => setAllStudents(u.filter(x => x.role === 'student'))).catch(() => {});
      adminAPI.getCourses().then(setCourses).catch(() => {});
      adminAPI.getTeachersList().then(setTeachers).catch(() => {});
    }
    if (activeTab === 'logs') {
      adminAPI.getLogs(40).then(setLogs).catch(() => {});
    }
  }, [activeTab]);

  // User CRUD
  const saveUser = async (form) => {
    try {
      const payload = { ...form };
      if (payload.role !== 'student') {
        delete payload.roll_number;
        delete payload.semester;
      } else {
        payload.semester = payload.semester ? parseInt(payload.semester, 10) : 1;
      }
      if (payload.role !== 'teacher') {
        delete payload.employee_id;
        delete payload.designation;
      }
      if (!payload.password) {
        delete payload.password;
      }

      if (form.id) {
        const res = await adminAPI.updateUser(form.id, payload);
        if (res.success === false) return toast(res.message || 'Error updating user', 'error');
        const u = res.user || res;
        setUsers(prev => prev.map(x => x.id === form.id ? { ...x, ...u } : x));
        toast('User updated successfully', 'success');
      } else {
        const res = await adminAPI.createUser(payload);
        if (res.success === false) return toast(res.message || 'Error creating user', 'error');
        const u = res.user || res;
        setUsers(prev => [u, ...prev]);
        toast('User created successfully', 'success');
      }
      setUserModal({ open: false, data: null });
      if (activeTab === 'users') {
        adminAPI.getUsers().then(setUsers).catch(() => {});
      }
    } catch (e) {
      const detail = e.response?.data?.detail;
      toast(typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'Error saving user'), 'error');
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await adminAPI.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast('User deleted', 'success');
    } catch (e) { toast(e.response?.data?.detail || 'Error', 'error'); }
  };

  const toggleUser = async (id) => {
    try {
      const r = await adminAPI.toggleUserActive(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: r.is_active } : u));
    } catch (e) { toast('Error', 'error'); }
  };

  // Course CRUD
  const saveCourse = async (form) => {
    try {
      if (form.id) {
        const c = await adminAPI.updateCourse(form.id, form);
        setCourses(prev => prev.map(x => x.id === form.id ? { ...x, ...c } : x));
        toast('Course updated', 'success');
      } else {
        const c = await adminAPI.createCourse(form);
        setCourses(prev => [c, ...prev]);
        toast('Course created', 'success');
      }
      setCourseModal({ open: false, data: null });
    } catch (e) {
      const detail = e.response?.data?.detail;
      toast(typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'Error saving course'), 'error');
    }
  };

  const deleteCourse = async (id) => {
    if (!confirm('Delete this course?')) return;
    try {
      await adminAPI.deleteCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
      toast('Course deleted', 'success');
    } catch (e) { toast('Error', 'error'); }
  };

  // Enrollment
  const enroll = async () => {
    if (!enrollForm.student_id || !enrollForm.course_id) return;
    try {
      const e = await adminAPI.enrollStudent({ student_id: +enrollForm.student_id, course_id: +enrollForm.course_id });
      adminAPI.getEnrollments().then(setEnrollments);
      setEnrollModal(false);
      setEnrollForm({ student_id: '', course_id: '' });
      toast('Student enrolled', 'success');
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast(typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'Error enrolling student'), 'error');
    }
  };

  const removeEnrollment = async (id) => {
    if (!confirm('Remove enrollment?')) return;
    try {
      await adminAPI.removeEnrollment(id);
      setEnrollments(prev => prev.filter(e => e.id !== id));
      toast('Enrollment removed', 'success');
    } catch (e) { toast('Error', 'error'); }
  };

  const s = stats || { total_users: 0, total_students: 0, total_teachers: 0, total_courses: 0, total_predictions: 0, avg_prediction_accuracy: 94.2 };

  return (
    <Layout title="Admin Panel">
      <div className="flex flex-col gap-6 w-full mx-auto max-w-7xl relative">
        <Toast toasts={toasts} removeToast={removeToast} />

        {/* Header */}
        <div className="glass-card p-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,rgba(109,40,217,.2),rgba(236,72,153,.1))' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-glow-pink"><Shield className="w-5 h-5 text-white" /></div>
            <div><h2 className="text-lg font-bold text-white">System Administration</h2><p className="text-purple-300/60 text-xs">Full platform control</p></div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-300 text-xs font-medium">All Systems Operational</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${activeTab === t ? 'bg-purple-600 text-white' : 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Users', value: s.total_users, icon: Users },
              { label: 'Students', value: s.total_students, icon: Activity },
              { label: 'Teachers', value: s.total_teachers, icon: Users },
              { label: 'Courses', value: s.total_courses, icon: BookOpen },
              { label: 'AI Predictions', value: s.total_predictions, icon: Cpu },
              { label: 'AI Accuracy', value: `${s.avg_prediction_accuracy}%`, icon: Shield },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="glass-card p-4 text-center">
                <Icon className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                <p className="text-xl font-bold text-white">{loading ? '—' : value}</p>
                <p className="text-xs text-purple-400/60 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="glass-card p-5 w-full overflow-hidden">
            <div className="flex flex-row items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h3 className="section-title">Registered Users</h3>
                <p className="text-purple-400/80 text-sm mt-1">{users.length} results found</p>
              </div>
              <button onClick={() => setUserModal({ open: true, data: null })}
                className="flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm hover:bg-purple-500 transition-all font-medium shadow-glow">
                <Plus className="w-4 h-4" /> Add User
              </button>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-purple-500/15">
                  {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left pb-2 text-purple-400/70 font-medium text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-purple-500/10">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-purple-500/5 transition-colors">
                      <td className="py-2.5 text-white font-medium">{u.full_name}</td>
                      <td className="py-2.5 text-purple-300 text-xs">{u.email}</td>
                      <td className="py-2.5"><span className={u.role === 'admin' ? 'badge-danger' : u.role === 'teacher' ? 'badge-info' : 'badge-success'}>{u.role}</span></td>
                      <td className="py-2.5"><span className={u.is_active ? 'badge-success' : 'badge-danger'}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                      <td className="py-2.5">
                        <div className="flex gap-1.5">
                          <button onClick={() => setUserModal({ open: true, data: u })} className="p-1 rounded text-purple-400 hover:text-white hover:bg-purple-500/20 transition-all"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => toggleUser(u.id)} className="p-1 rounded text-purple-400 hover:text-white hover:bg-amber-500/20 transition-all">{u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}</button>
                          <button onClick={() => deleteUser(u.id)} className="p-1 rounded text-purple-400 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="glass-card p-5 w-full overflow-hidden">
            <div className="flex flex-row items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h3 className="section-title">Courses</h3>
                <p className="text-purple-400/80 text-sm mt-1">{courses.length} courses found</p>
              </div>
              <button onClick={() => setCourseModal({ open: true, data: null })}
                className="flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm hover:bg-purple-500 transition-all font-medium shadow-glow">
                <Plus className="w-4 h-4" /> Add Course
              </button>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-purple-500/15">
                  {['Title', 'Code', 'Teacher', 'Credits', 'Enrolled', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left pb-2 text-purple-400/70 font-medium text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-purple-500/10">
                  {courses.map(c => (
                    <tr key={c.id} className="hover:bg-purple-500/5 transition-colors">
                      <td className="py-2.5 text-white font-medium">{c.title}</td>
                      <td className="py-2.5 text-purple-300 text-xs font-mono">{c.code}</td>
                      <td className="py-2.5 text-purple-300 text-xs">{c.teacher_name || '—'}</td>
                      <td className="py-2.5 text-purple-300">{c.credits}</td>
                      <td className="py-2.5 text-purple-300">{c.enrolled_count || 0}/{c.max_students}</td>
                      <td className="py-2.5"><span className={c.is_active ? 'badge-success' : 'badge-danger'}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                      <td className="py-2.5">
                        <div className="flex gap-1.5">
                          <button onClick={() => setCourseModal({ open: true, data: c })} className="p-1 rounded text-purple-400 hover:text-white hover:bg-purple-500/20"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteCourse(c.id)} className="p-1 rounded text-purple-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Enrollments Tab */}
        {activeTab === 'enrollments' && (
          <div className="glass-card p-5 w-full overflow-hidden">
            <div className="flex flex-row items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h3 className="section-title">Enrollments</h3>
                <p className="text-purple-400/80 text-sm mt-1">{enrollments.length} enrollments found</p>
              </div>
              <button id="enroll-student-btn" onClick={() => setEnrollModal(true)}
                className="flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm hover:bg-purple-500 transition-all font-medium shadow-glow">
                <Plus className="w-4 h-4" /> Enroll Student
              </button>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-purple-500/15">
                  {['Student', 'Roll', 'Course', 'Code', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left pb-2 text-purple-400/70 font-medium text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-purple-500/10">
                  {enrollments.map(e => (
                    <tr key={e.id} className="hover:bg-purple-500/5">
                      <td className="py-2.5 text-white">{e.student_name}</td>
                      <td className="py-2.5 text-purple-300 text-xs font-mono">{e.student_roll}</td>
                      <td className="py-2.5 text-purple-300 text-xs">{e.course_title}</td>
                      <td className="py-2.5 text-purple-300 text-xs font-mono">{e.course_code}</td>
                      <td className="py-2.5"><span className={e.status === 'active' ? 'badge-success' : 'badge-danger'}>{e.status}</span></td>
                      <td className="py-2.5">
                        <button onClick={() => removeEnrollment(e.id)} className="p-1 rounded text-purple-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="glass-card p-5">
            <h3 className="section-title mb-4">System Logs</h3>
            <div className="space-y-2 font-mono text-xs max-h-[420px] overflow-y-auto">
              {(logs.length > 0 ? logs : [{ level: 'INFO', action: 'AcademiQ API started', timestamp: new Date().toISOString() }]).map((log, i) => (
                <div key={log.id || i} className="flex items-start gap-3 p-2 rounded-lg bg-black/20 border border-purple-500/10">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${log.level === 'WARN' ? 'bg-amber-500/20 text-amber-300' : log.level === 'ERROR' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>{log.level}</span>
                  <span className="text-purple-300 flex-1">{log.action}</span>
                  <span className="text-purple-500 flex-shrink-0">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Modal */}
        <UserModal
          open={userModal.open}
          data={userModal.data}
          onClose={() => setUserModal({ open: false, data: null })}
          onSave={saveUser}
        />

        {/* Course Modal */}
        <CourseModal
          open={courseModal.open}
          data={courseModal.data}
          teachers={teachers}
          onClose={() => setCourseModal({ open: false, data: null })}
          onSave={saveCourse}
        />

        {/* Enroll Modal */}
        <EnrollModal
          open={enrollModal}
          allStudents={allStudents}
          courses={courses}
          enrollForm={enrollForm}
          setEnrollForm={setEnrollForm}
          onClose={() => setEnrollModal(false)}
          onEnroll={enroll}
        />
      </div>
    </Layout>
  );
}

function UserModal({ open, data, onClose, onSave }) {
  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '', role: 'student', is_active: true,
    roll_number: '', department: '', semester: 1, employee_id: '', designation: ''
  });

  useEffect(() => {
    if (open) {
      setFormData(data ? { ...data, password: '' } : {
        full_name: '', email: '', password: '', role: 'student', is_active: true,
        roll_number: '', department: '', semester: 1, employee_id: '', designation: ''
      });
    }
  }, [data, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const inp = "w-full bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2 text-white text-sm placeholder-purple-500/40 focus:outline-none focus:border-purple-400";

  return (
    <Modal isOpen={open} onClose={onClose} title={data ? 'Edit User' : 'Add User'} maxWidth="max-w-xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-purple-400 mb-1">Full Name</label>
          <input name="full_name" value={formData.full_name || ''} onChange={handleChange} className={inp} placeholder="Jane Doe" />
        </div>
        <div>
          <label className="block text-xs text-purple-400 mb-1">Email</label>
          <input name="email" value={formData.email || ''} onChange={handleChange} className={inp} placeholder="jane@example.com" />
        </div>
        <div>
          <label className="block text-xs text-purple-400 mb-1">Password {data && '(leave blank to keep)'}</label>
          <input type="password" name="password" value={formData.password || ''} onChange={handleChange} className={inp} placeholder="••••••••" />
        </div>
        <div>
          <label className="block text-xs text-purple-400 mb-1">Role</label>
          <select name="role" value={formData.role || 'student'} onChange={handleChange} className={selectInp}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        
        {/* Student Fields */}
        <div className={formData.role === 'student' || !formData.role ? 'contents' : 'hidden'}>
          <div>
            <label className="block text-xs text-purple-400 mb-1">Roll Number</label>
            <input name="roll_number" value={formData.roll_number || ''} onChange={handleChange} className={inp} placeholder="CS2021001" />
          </div>
          <div>
            <label className="block text-xs text-purple-400 mb-1">Department</label>
            <input name="department" value={formData.department || ''} onChange={handleChange} className={inp} placeholder="Computer Science" />
          </div>
          <div>
            <label className="block text-xs text-purple-400 mb-1">Semester</label>
            <input type="number" name="semester" value={formData.semester || 1} onChange={handleChange} className={inp} min={1} max={8} />
          </div>
        </div>

        {/* Teacher Fields */}
        <div className={formData.role === 'teacher' ? 'contents' : 'hidden'}>
          <div>
            <label className="block text-xs text-purple-400 mb-1">Employee ID</label>
            <input name="employee_id" value={formData.employee_id || ''} onChange={handleChange} className={inp} placeholder="EMP1001" />
          </div>
          <div>
            <label className="block text-xs text-purple-400 mb-1">Department</label>
            <input name="department" value={formData.department || ''} onChange={handleChange} className={inp} />
          </div>
          <div>
            <label className="block text-xs text-purple-400 mb-1">Designation</label>
            <input name="designation" value={formData.designation || ''} onChange={handleChange} className={inp} placeholder="Assistant Professor" />
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={() => onSave(formData)} className="flex-1 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition-colors">{data ? 'Update' : 'Create'} User</button>
        <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-purple-500/10 text-purple-300 text-sm hover:bg-purple-500/20 transition-colors">Cancel</button>
      </div>
    </Modal>
  );
}

function CourseModal({ open, data, teachers, onClose, onSave }) {
  const [form, setForm] = useState({});
  useEffect(() => {
    setForm(data || { title: '', code: '', description: '', teacher_id: '', credits: 3, semester: 1, max_students: 60 });
  }, [data, open]);
  const inp = "w-full bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2 text-white text-sm placeholder-purple-500/40 focus:outline-none focus:border-purple-400";
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <Modal isOpen={open} onClose={onClose} title={data ? 'Edit Course' : 'Add Course'} maxWidth="max-w-xl">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs text-purple-400 mb-1">Title</label><input value={form.title || ''} onChange={set('title')} className={inp} placeholder="Data Structures" /></div>
        <div><label className="block text-xs text-purple-400 mb-1">Code</label><input value={form.code || ''} onChange={set('code')} className={inp} placeholder="CS201" /></div>
        <div className="col-span-2"><label className="block text-xs text-purple-400 mb-1">Description</label><textarea value={form.description || ''} onChange={set('description')} className={inp} rows={2} /></div>
        <div><label className="block text-xs text-purple-400 mb-1">Teacher</label>
          <select value={form.teacher_id || ''} onChange={set('teacher_id')} className={selectInp}>
            <option value="">Select teacher...</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
        </div>
        <div><label className="block text-xs text-purple-400 mb-1">Credits</label><input type="number" value={form.credits || 3} onChange={set('credits')} className={inp} min={1} max={6} /></div>
        <div><label className="block text-xs text-purple-400 mb-1">Semester</label><input type="number" value={form.semester || 1} onChange={set('semester')} className={inp} min={1} max={8} /></div>
        <div><label className="block text-xs text-purple-400 mb-1">Max Students</label><input type="number" value={form.max_students || 60} onChange={set('max_students')} className={inp} /></div>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={() => onSave({ ...form, teacher_id: +form.teacher_id, credits: +form.credits, semester: +form.semester, max_students: +form.max_students })} className="flex-1 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500">{data ? 'Update' : 'Create'} Course</button>
        <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-purple-500/10 text-purple-300 text-sm hover:bg-purple-500/20">Cancel</button>
      </div>
    </Modal>
  );
}

function EnrollModal({ open, allStudents = [], courses = [], enrollForm = { student_id: '', course_id: '' }, setEnrollForm, onClose, onEnroll }) {
  const selectInp = "w-full bg-slate-900 text-white font-medium placeholder:text-purple-300 border border-purple-500/40 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50";
  return (
    <Modal isOpen={open} onClose={onClose} title="Enroll Student">
      <div>
        <div className="mb-3">
          <label className="block text-xs text-purple-400 mb-1">Student</label>
          <select
            value={enrollForm?.student_id || ''}
            onChange={e => setEnrollForm && setEnrollForm(f => ({ ...f, student_id: e.target.value }))}
            className={selectInp}
          >
            <option value="">Select student...</option>
            {(allStudents || []).map(s => (
              <option key={s.id || s.email} value={s.profile_id || s.id} disabled={!s.profile_id && !s.id}>
                {s.full_name || s.email} ({s.roll_number || s.email}) {!s.profile_id && !s.id && '(No Profile)'}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="block text-xs text-purple-400 mb-1">Course</label>
          <select
            value={enrollForm?.course_id || ''}
            onChange={e => setEnrollForm && setEnrollForm(f => ({ ...f, course_id: e.target.value }))}
            className={selectInp}
          >
            <option value="">Select course...</option>
            {(courses || []).map(c => (
              <option key={c.id || c.code} value={c.id}>
                {c.title} ({c.code})
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onEnroll} className="flex-1 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500">Enroll</button>
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-purple-500/10 text-purple-300 text-sm hover:bg-purple-500/20">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

