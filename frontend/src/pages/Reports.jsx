import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Layout from '../components/Layout';
import Toast, { useToast } from '../components/Toast';
import { studentAPI, teacherAPI, attendanceAPI, adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileDown, Users, BookOpen, ClipboardList } from 'lucide-react';

export default function Reports() {
  const { user } = useAuth();
  const [generating, setGenerating] = useState('');
  const { toasts, toast, removeToast } = useToast();

  const downloadPDF = (rows, filename, title) => {
    if (!rows || rows.length === 0) { toast('No data to export', 'warning'); return; }
    
    const doc = new jsPDF();
    const headers = Object.keys(rows[0]);
    const data = rows.map(r => headers.map(h => r[h] ?? ''));

    // Header styling
    doc.setFontSize(20);
    doc.setTextColor(139, 92, 246); // Purple-500
    doc.text('AcademiQ', 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(title, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 40,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [139, 92, 246] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { top: 40 }
    });

    doc.save(filename);
  };

  const exportStudents = async () => {
    setGenerating('students');
    try {
      const students = await studentAPI.getAll();
      downloadPDF(students.map(s => ({
        Name: s.full_name, Email: s.email, Roll: s.roll_number,
        Department: s.department, Semester: s.semester, GPA: s.gpa,
      })), 'students_report.pdf', 'Students Profile Report');
      toast('Students PDF downloaded!', 'success');
    } catch { toast('Error generating report', 'error'); }
    setGenerating('');
  };

  const exportAttendance = async () => {
    setGenerating('attendance');
    try {
      const students = await studentAPI.getAll();
      const rows = [];
      for (const s of students.slice(0, 30)) {
        const att = await studentAPI.getMyAttendance().catch(() => []);
        rows.push({ Name: s.full_name, Roll: s.roll_number });
      }
      const atRisk = await teacherAPI.getAtRiskStudents();
      downloadPDF(atRisk.map(s => ({
        Name: s.full_name, Roll: s.roll_number, Course: s.course_name,
        'Attendance %': `${s.attendance_pct}%`, 'Risk Level': s.risk_level, Action: s.action,
      })), 'at_risk_attendance_report.pdf', 'At-Risk Students Attendance Report');
      toast('Attendance PDF downloaded!', 'success');
    } catch { toast('Error generating report', 'error'); }
    setGenerating('');
  };

  const exportAdminUsers = async () => {
    setGenerating('users');
    try {
      const users = await adminAPI.getUsers();
      downloadPDF(users.map(u => ({
        Name: u.full_name, Email: u.email, Role: u.role,
        Status: u.is_active ? 'Active' : 'Inactive',
        'Created At': new Date(u.created_at).toLocaleDateString(),
      })), 'users_report.pdf', 'System Users Report');
      toast('Users PDF downloaded!', 'success');
    } catch { toast('Error generating report', 'error'); }
    setGenerating('');
  };

  const exportCourses = async () => {
    setGenerating('courses');
    try {
      const courses = await adminAPI.getCourses();
      downloadPDF(courses.map(c => ({
        Title: c.title, Code: c.code, Teacher: c.teacher_name,
        Credits: c.credits, Semester: c.semester,
        Enrolled: c.enrolled_count, Max: c.max_students,
        Status: c.is_active ? 'Active' : 'Inactive',
      })), 'courses_report.pdf', 'Course Management Report');
      toast('Courses PDF downloaded!', 'success');
    } catch { toast('Error generating report', 'error'); }
    setGenerating('');
  };

  const reports = [
    {
      id: 'students', title: 'Students Report', desc: 'All student profiles with GPA and department info',
      icon: Users, color: 'purple', action: exportStudents, roles: ['teacher', 'admin'],
    },
    {
      id: 'attendance', title: 'At-Risk Attendance', desc: 'Students flagged as at-risk with attendance breakdown',
      icon: ClipboardList, color: 'orange', action: exportAttendance, roles: ['teacher', 'admin'],
    },
    {
      id: 'courses', title: 'Courses Report', desc: 'All courses with teacher, enrollment, and status info',
      icon: BookOpen, color: 'cyan', action: exportCourses, roles: ['admin'],
    },
    {
      id: 'users', title: 'Users Report', desc: 'All platform users by role and account status',
      icon: Users, color: 'pink', action: exportAdminUsers, roles: ['admin'],
    },
  ].filter(r => r.roles.includes(user?.role));

  const COLOR_MAP = {
    purple: { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)', text: '#c4b5fd' },
    cyan:   { bg: 'rgba(6,182,212,0.15)',  border: 'rgba(6,182,212,0.3)',  text: '#67e8f9' },
    orange: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', text: '#fcd34d' },
    pink:   { bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.3)', text: '#f9a8d4' },
  };

  return (
    <Layout title="Reports">
      <div className="space-y-5 max-w-5xl">
        <Toast toasts={toasts} removeToast={removeToast} />

        <div className="glass-card p-5 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,rgba(109,40,217,.2),rgba(236,72,153,.1))' }}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center"><FileDown className="w-5 h-5 text-white" /></div>
          <div><h2 className="text-lg font-bold text-white">Reports & Exports</h2><p className="text-purple-300/70 text-xs">Download PDF reports for offline analysis</p></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reports.map(r => {
            const c = COLOR_MAP[r.color];
            const Icon = r.icon;
            return (
              <div key={r.id} className="glass-card p-6 flex flex-col justify-between gap-4" style={{ border: `1px solid ${c.border}` }}>
                <div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: c.bg }}>
                    <Icon className="w-5 h-5" style={{ color: c.text }} />
                  </div>
                  <h3 className="text-white font-semibold mb-1">{r.title}</h3>
                  <p className="text-purple-400/70 text-sm">{r.desc}</p>
                </div>
                <button
                  onClick={r.action}
                  disabled={generating === r.id}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                  style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                >
                  <FileDown className="w-4 h-4" />
                  {generating === r.id ? 'Generating...' : 'Download PDF'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="glass-card p-4 text-center">
          <p className="text-purple-400/60 text-xs">Reports are exported as branded PDF documents with structured data tables.</p>
        </div>
      </div>
    </Layout>
  );
}
