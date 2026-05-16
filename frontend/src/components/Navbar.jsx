import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, GraduationCap, BookOpen, Users, X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { searchAPI } from '../services/api';

// ── Debounce hook ────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Search Dropdown ──────────────────────────────────────────────────
function SearchDropdown({ results, query, onSelect, loading }) {
  const total = results.students.length + results.courses.length + results.teachers.length;

  if (!query || query.length < 1) return null;
  if (loading) {
    return (
      <div className="search-dropdown">
        <div className="flex items-center justify-center py-6 gap-2 text-purple-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Searching...</span>
        </div>
      </div>
    );
  }
  if (total === 0) {
    return (
      <div className="search-dropdown">
        <div className="py-6 text-center text-purple-400/60 text-sm">
          No results for "<span className="text-purple-300">{query}</span>"
        </div>
      </div>
    );
  }

  return (
    <div className="search-dropdown">
      {results.students.length > 0 && (
        <div>
          <p className="search-group-label">
            <GraduationCap className="w-3 h-3" /> Students
          </p>
          {results.students.map((s) => (
            <button key={`s-${s.id}`} onClick={() => onSelect(s)}
              className="search-result-item">
              <div className="w-7 h-7 rounded-full bg-purple-500/30 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
                {s.full_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-white text-sm font-medium truncate">{s.full_name}</p>
                <p className="text-purple-400/60 text-xs">{s.roll_number} · {s.department}</p>
              </div>
              <span className="badge-info text-xs">Student</span>
            </button>
          ))}
        </div>
      )}

      {results.courses.length > 0 && (
        <div>
          <p className="search-group-label">
            <BookOpen className="w-3 h-3" /> Courses
          </p>
          {results.courses.map((c) => (
            <button key={`c-${c.id}`} onClick={() => onSelect(c)}
              className="search-result-item">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs text-cyan-300 font-bold flex-shrink-0">
                {c.code?.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-white text-sm font-medium truncate">{c.title}</p>
                <p className="text-purple-400/60 text-xs">{c.code} · {c.teacher_name}</p>
              </div>
              <span className="badge-success text-xs">Course</span>
            </button>
          ))}
        </div>
      )}

      {results.teachers.length > 0 && (
        <div>
          <p className="search-group-label">
            <Users className="w-3 h-3" /> Teachers
          </p>
          {results.teachers.map((t) => (
            <button key={`t-${t.id}`} onClick={() => onSelect(t)}
              className="search-result-item">
              <div className="w-7 h-7 rounded-full bg-pink-500/20 flex items-center justify-center text-xs text-pink-300 font-bold flex-shrink-0">
                {t.full_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-white text-sm font-medium truncate">{t.full_name}</p>
              </div>
              <span className="badge-warning text-xs">Teacher</span>
            </button>
          ))}
        </div>
      )}

      <div className="px-4 py-2 border-t border-purple-500/10 text-xs text-purple-500 text-center">
        {total} result{total !== 1 ? 's' : ''} found
      </div>
    </div>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────
export default function Navbar({ title }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ students: [], courses: [], teachers: [] });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // Run search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 1) {
      setResults({ students: [], courses: [], teachers: [] });
      return;
    }
    setLoading(true);
    searchAPI.global(debouncedQuery)
      .then(setResults)
      .catch(() => setResults({ students: [], courses: [], teachers: [] }))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = useCallback((item) => {
    navigate(item.url || '/');
    setQuery('');
    setOpen(false);
  }, [navigate]);

  const clearSearch = () => {
    setQuery('');
    setResults({ students: [], courses: [], teachers: [] });
  };

  return (
    <header className="h-16 fixed top-0 right-0 left-64 z-30 flex items-center justify-between px-6"
      style={{ background: 'rgba(15, 10, 26, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>

      {/* Left - Page Title */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-xs text-purple-400">{dateStr} • {timeStr}</p>
        </div>
      </div>

      {/* Center - Live Search */}
      <div className="flex-1 max-w-md mx-8 hidden lg:block relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search students, courses, teachers..."
            className="w-full bg-slate-900/60 text-white placeholder:text-purple-300 caret-white border border-purple-500/30 rounded-xl pl-10 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
          {query && (
            <button onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400/60 hover:text-purple-300 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {open && (
          <SearchDropdown
            results={results}
            query={query}
            onSelect={handleSelect}
            loading={loading}
          />
        )}
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-3">
        {/* AI Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs text-purple-300 font-medium">AI Active</span>
        </div>

        {/* Notification Bell */}
        <NotificationBell />

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
          {user?.full_name?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  );
}
