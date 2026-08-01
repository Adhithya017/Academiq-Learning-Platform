import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Sparkles, Brain, BarChart3, Users, AlertCircle, Loader2, Database } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMsg('');
    try {
      const data = await authAPI.seedDemoDatabase();
      setSeedMsg(data?.message || 'Seed request sent!');
    } catch (err) {
      setSeedMsg(
        err.response?.status === 401
          ? 'Log in as admin first to seed the database.'
          : err.response?.data?.detail || 'Seed failed. Run seed.py manually.'
      );
    } finally {
      setSeeding(false);
    }
  };

  const handleQuickLogin = (role) => {
    if (role === 'student') {
      setEmail('cs2021001@academiq.com');
      setPassword('Student@123');
    } else if (role === 'teacher') {
      setEmail('teacher1@academiq.com');
      setPassword('Teacher@123');
    } else if (role === 'admin') {
      setEmail('admin@academiq.com');
      setPassword('Admin@123');
    }
  };

  const features = [
    { icon: Brain, label: 'AI-Powered Analytics', desc: 'Predict performance and dropout risk in real-time' },
    { icon: BarChart3, label: 'Visual Dashboards', desc: 'Rich interactive charts and progress tracking' },
    { icon: Users, label: 'Multi-Role Access', desc: 'Tailored experience for students, teachers & admins' },
  ];

  return (
    <div className="min-h-screen flex bg-surface dot-grid">
      {/* Left - Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1040 0%, #0f0a2e 100%)' }}>
        
        {/* Animated blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 rounded-full opacity-20 animate-[float_8s_ease-in-out_infinite]"
            style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', top: '-50px', left: '-50px' }}></div>
          <div className="absolute w-80 h-80 rounded-full opacity-15 animate-[float_10s_ease-in-out_infinite_2s]"
            style={{ background: 'radial-gradient(circle, #ec4899, transparent)', bottom: '100px', right: '-30px' }}></div>
          <div className="absolute w-64 h-64 rounded-full opacity-10 animate-[float_7s_ease-in-out_infinite_4s]"
            style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', top: '40%', left: '40%' }}></div>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-glow">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gradient">AcademiQ</h1>
            <p className="text-xs text-purple-400">AI Academic Platform</p>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-5xl font-black text-white leading-tight mb-4">
              Intelligent<br />
              <span className="text-gradient">Academic</span><br />
              Excellence
            </h2>
            <p className="text-purple-300/80 text-lg leading-relaxed">
              Harness the power of AI to predict performance, detect dropout risk, and unlock every student's potential.
            </p>
          </div>

          <div className="space-y-4">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-purple-500/15 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{label}</p>
                  <p className="text-purple-400/70 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 relative z-10">
          {[['94.2%', 'AI Accuracy'], ['20+', 'Students'], ['12ms', 'Prediction']].map(([val, label]) => (
            <div key={label} className="text-center p-3 rounded-xl bg-white/5 border border-purple-500/15">
              <p className="text-2xl font-bold text-gradient">{val}</p>
              <p className="text-xs text-purple-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-glow">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gradient">AcademiQ</h1>
          </div>

          <div className="glass-card p-8">
            <div className="mb-5">
              <h3 className="text-2xl font-bold text-white mb-1">Welcome back</h3>
              <p className="text-purple-400/70 text-sm">Sign in to access your AI-powered dashboard</p>
            </div>

            {/* Quick login buttons */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-purple-300 mb-2">⚡ Click a role to auto-fill credentials:</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button type="button" onClick={() => handleQuickLogin('student')}
                  className="py-2.5 px-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs font-semibold hover:bg-purple-500/30 transition-all text-center flex flex-col items-center gap-0.5">
                  <span>🎓 Student Demo</span>
                  <span className="text-[10px] text-purple-300/70">cs2021001@academiq.com</span>
                </button>
                <button type="button" onClick={() => handleQuickLogin('teacher')}
                  className="py-2.5 px-3 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-200 text-xs font-semibold hover:bg-pink-500/30 transition-all text-center flex flex-col items-center gap-0.5">
                  <span>👩‍🏫 Teacher Demo</span>
                  <span className="text-[10px] text-pink-300/70">teacher1@academiq.com</span>
                </button>
              </div>
              <p className="text-[11px] text-purple-300/60 text-center">
                Demo passwords: <span className="text-purple-200 font-mono">Student@123</span> / <span className="text-pink-200 font-mono">Teacher@123</span>
              </p>
            </div>

            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-purple-500/20"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface-card px-3 text-purple-400/60">or sign in manually</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@academiq.com"
                    className="input-field pl-11"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-11 pr-11"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-400/60 hover:text-purple-300 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button id="login-btn" type="submit" disabled={loading}
                className="glow-btn w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Signing in...' : 'Sign In to AcademiQ'}
              </button>
            </form>

            {/* Seed helper */}
            <div className="mt-5 pt-4 border-t border-purple-500/15 text-center">
              <button
                id="seed-db-btn"
                type="button"
                onClick={handleSeed}
                disabled={seeding}
                className="inline-flex items-center gap-1.5 text-xs text-purple-400/60 hover:text-purple-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {seeding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                {seeding ? 'Seeding...' : 'Seed demo database'}
              </button>
              {seedMsg && (
                <p className="mt-1.5 text-xs text-purple-400/70">{seedMsg}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
