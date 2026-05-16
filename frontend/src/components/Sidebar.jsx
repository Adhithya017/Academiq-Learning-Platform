import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, BookOpen, Brain, Settings,
  LogOut, GraduationCap, Trophy, Bell, ChevronRight,
  BarChart3, FileDown
} from 'lucide-react';

const studentLinks = [
  { to: '/student', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/courses', icon: BookOpen, label: 'My Courses' },
  { to: '/analytics', icon: Brain, label: 'AI Analytics' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

const teacherLinks = [
  { to: '/teacher', icon: LayoutDashboard, label: 'Overview' },
  { to: '/courses', icon: BookOpen, label: 'Courses' },
  { to: '/analytics', icon: Brain, label: 'AI Analytics' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/reports', icon: FileDown, label: 'Reports' },
];

const adminLinks = [
  { to: '/teacher', icon: BarChart3, label: 'Analytics' },
  { to: '/admin', icon: Settings, label: 'Admin Panel' },
  { to: '/analytics', icon: Brain, label: 'AI Engine' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/reports', icon: FileDown, label: 'Reports' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links =
    user?.role === 'admin' ? adminLinks :
    user?.role === 'teacher' ? teacherLinks :
    studentLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColor = {
    admin: 'text-pink-400',
    teacher: 'text-cyan-400',
    student: 'text-purple-400',
  }[user?.role] || 'text-purple-400';

  return (
    <aside className="fixed left-0 top-0 h-full w-64 z-40 flex flex-col"
      style={{ background: 'linear-gradient(180deg, #0d0820 0%, #13092a 100%)', borderRight: '1px solid rgba(139, 92, 246, 0.15)' }}>

      {/* Logo */}
      <div className="p-6 border-b border-purple-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-glow">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient">AcademiQ</h1>
            <p className="text-xs text-purple-400/60">AI Learning Platform</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="px-4 py-4 border-b border-purple-500/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{user?.full_name || 'User'}</p>
            <p className={`text-xs capitalize font-medium ${roleColor}`}>{user?.role || 'Student'}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-500 flex-shrink-0" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-purple-500/60 uppercase tracking-wider px-3 mb-3">Main Menu</p>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Version Info */}
      <div className="px-4 pb-2">
        <div className="px-3 py-2 rounded-xl bg-purple-500/5 border border-purple-500/10">
          <p className="text-xs text-purple-500/60 text-center">AcademiQ v2.0 • AI-Powered</p>
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-purple-500/10">
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
