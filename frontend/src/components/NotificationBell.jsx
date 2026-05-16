import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import { notificationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      try {
        const c = await notificationsAPI.getUnreadCount();
        setCount(c);
      } catch { /* ignore */ }
    };
    const fetchNotifs = async () => {
      try {
        const ns = await notificationsAPI.getAll();
        setNotifications(ns.slice(0, 5));
      } catch { /* ignore */ }
    };
    fetchCount();
    fetchNotifs();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const TYPE_DOT = {
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    success: 'bg-emerald-400',
    info: 'bg-cyan-400',
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 hover:bg-purple-500/20 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 z-50 rounded-2xl shadow-glass overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a1030, #13092a)', border: '1px solid rgba(139,92,246,0.25)' }}>
          <div className="flex items-center justify-between p-4 border-b border-purple-500/15">
            <h3 className="text-white font-semibold text-sm">Notifications</h3>
            <button
              onClick={() => { navigate('/notifications'); setOpen(false); }}
              className="text-xs text-purple-400 hover:text-purple-300">View all</button>
          </div>

          <div className="divide-y divide-purple-500/10 max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-purple-400/60 text-sm">No notifications</div>
            ) : notifications.map((n) => (
              <div key={n.id}
                className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-purple-500/5 transition-colors ${!n.is_read ? '' : 'opacity-60'}`}
                onClick={() => !n.is_read && markRead(n.id)}>
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${TYPE_DOT[n.type] || 'bg-purple-400'} ${!n.is_read ? '' : 'opacity-0'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium leading-snug">{n.title}</p>
                  <p className="text-purple-400/60 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-purple-500 text-xs mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <button onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                    className="text-purple-400 hover:text-emerald-400 transition-colors flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-purple-500/15">
            <button
              onClick={() => { navigate('/notifications'); setOpen(false); }}
              className="w-full text-center text-xs text-purple-400 hover:text-purple-300 py-1 transition-colors">
              See all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
