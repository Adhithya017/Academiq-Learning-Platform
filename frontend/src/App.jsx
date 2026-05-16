import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AIAnalytics from './pages/AIAnalytics';
import CoursePage from './pages/CoursePage';
import AdminPanel from './pages/AdminPanel';
import Leaderboard from './pages/Leaderboard';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';

function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-purple-400 font-medium">Loading AcademiQ...</p>
          <p className="text-purple-500/60 text-xs mt-1">AI Engine Initializing</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirect =
      user.role === 'admin' ? '/admin' :
      user.role === 'teacher' ? '/teacher' : '/student';
    return <Navigate to={redirect} replace />;
  }
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  const defaultRoute =
    user?.role === 'admin' ? '/admin' :
    user?.role === 'teacher' ? '/teacher' : '/student';

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={defaultRoute} /> : <Login />} />
      <Route path="/student" element={<PrivateRoute allowedRoles={['student']}><StudentDashboard /></PrivateRoute>} />
      <Route path="/students/:studentId" element={<PrivateRoute allowedRoles={['teacher', 'admin']}><StudentDashboard /></PrivateRoute>} />
      <Route path="/teacher" element={<PrivateRoute allowedRoles={['teacher', 'admin']}><TeacherDashboard /></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><AIAnalytics /></PrivateRoute>} />
      <Route path="/courses" element={<PrivateRoute><CoursePage /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute allowedRoles={['admin']}><AdminPanel /></PrivateRoute>} />
      <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute allowedRoles={['teacher', 'admin']}><Reports /></PrivateRoute>} />
      <Route path="*" element={<Navigate to={user ? defaultRoute : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
