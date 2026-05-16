import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AITip from '../components/AITip';
import { AreaChartBox, BarChartBox } from '../components/ChartBox';
import { coursesAPI } from '../services/api';
import { BookOpen, Users, Clock, Star, ChevronDown, ChevronUp } from 'lucide-react';

const CLUSTER_MAP = (pct) =>
  pct >= 85 ? { label: 'Elite Performers', color: '#10b981' } :
  pct >= 70 ? { label: 'Advanced Learners', color: '#8b5cf6' } :
  pct >= 55 ? { label: 'Regular Learners', color: '#06b6d4' } :
  { label: 'Needs Support', color: '#f59e0b' };

function CourseCard({ course }) {
  const [expanded, setExpanded] = useState(false);
  const score = course.avg_score || 0;
  const { label: cluster, color: clusterColor } = CLUSTER_MAP(score);
  const barColor = clusterColor;

  const progressData = Array.from({ length: 8 }, (_, i) => ({
    w: `W${i + 1}`,
    s: Math.min(100, Math.max(30, (score || 65) + (Math.random() - 0.5) * 15))
  }));

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: clusterColor + '20', border: `1px solid ${clusterColor}50`, color: clusterColor }}>
                {cluster}
              </span>
            </div>
            <h3 className="text-white font-bold text-lg">{course.title}</h3>
            <p className="text-purple-400/60 text-sm">{course.code} • {course.teacher_name || 'Instructor'}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black" style={{ color: barColor }}>
              {score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B+' : score >= 60 ? 'B' : 'C'}
            </p>
            <p className="text-xs text-purple-400 mt-0.5">{course.enrolled_count} students</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs text-purple-400 mb-1.5">
            <span>Avg Score</span><span>{score?.toFixed(1) || '—'}%</span>
          </div>
          <div className="h-2.5 bg-purple-500/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${score}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}99)` }} />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <Clock className="w-3.5 h-3.5" />
          <span>{course.credits} credits • Semester {course.semester}</span>
        </div>
      </div>

      <button onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3 flex items-center justify-between text-purple-400 hover:bg-purple-500/5 transition-colors border-t border-purple-500/10 text-sm">
        <span>{expanded ? 'Hide Details' : 'View Score Trend'}</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-purple-500/10">
          <div className="mt-4">
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">Score Trend (Simulated)</p>
            <AreaChartBox data={progressData} dataKey="s" xKey="w" color={barColor} height={140} />
          </div>
          {course.description && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">Description</p>
              <p className="text-xs text-purple-300/80">{course.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CoursePage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coursesAPI.getAll()
      .then(setCourses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const clusterData = [
    { cluster: 'Elite', avg: 93 }, { cluster: 'Advanced', avg: 82 },
    { cluster: 'Regular', avg: 71 }, { cluster: 'Support', avg: 58 },
  ];

  const totalEnrolled = courses.reduce((s, c) => s + (c.enrolled_count || 0), 0);
  const avgScore = courses.length > 0
    ? (courses.reduce((s, c) => s + (c.avg_score || 0), 0) / courses.length).toFixed(1)
    : '—';

  const fallbackCourses = [
    { id: 1, title: 'Machine Learning 101', code: 'CS101', teacher_name: 'Dr. Jane Smith', enrolled_count: 32, avg_score: 88, credits: 4, semester: 1 },
    { id: 2, title: 'Data Structures', code: 'CS102', teacher_name: 'Prof. Alan Kumar', enrolled_count: 45, avg_score: 74, credits: 4, semester: 1 },
    { id: 3, title: 'Web Engineering', code: 'CS103', teacher_name: 'Dr. Meena Rao', enrolled_count: 28, avg_score: 92, credits: 3, semester: 2 },
    { id: 4, title: 'Database Systems', code: 'CS104', teacher_name: 'Prof. Alan Kumar', enrolled_count: 38, avg_score: 68, credits: 3, semester: 2 },
  ];

  const displayCourses = courses.length > 0 ? courses : fallbackCourses;

  return (
    <Layout title="My Courses">
      <div className="space-y-6 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Courses', value: loading ? '—' : displayCourses.length, icon: BookOpen, color: 'text-purple-400' },
            { label: 'Total Enrolled', value: loading ? '—' : totalEnrolled || 143, icon: Users, color: 'text-cyan-400' },
            { label: 'Avg Score', value: loading ? '—' : `${avgScore}%`, icon: Star, color: 'text-amber-400' },
            { label: 'Active Semester', value: 'Sem 3', icon: Clock, color: 'text-emerald-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card p-4 flex items-center gap-3">
              <Icon className={`w-8 h-8 ${color} flex-shrink-0`} />
              <div>
                <p className="text-white font-bold text-xl">{value}</p>
                <p className="text-purple-400/60 text-xs">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Performance by AI Cluster</h3>
          </div>
          <BarChartBox data={clusterData} dataKeys={['avg']} xKey="cluster" height={180} />
        </div>

        <AITip tip="AI has clustered your students into 4 performance groups based on score patterns. 'Needs Support' group shows 60% correlation with low attendance. Consider targeted office hours and additional resources." type="info" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
