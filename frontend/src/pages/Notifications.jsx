import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { notificationsAPI } from '../services/api';
import { Bell, CheckCheck, AlertCircle, Info, CheckCircle, Sparkles, Clock } from 'lucide-react';

const TYPE_STYLES = {
  warning: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  danger: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  success: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  info: { icon: Info, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    notificationsAPI.getAll()
      .then(setNotifications)
      .catch(() => {
        setNotifications([
          { id: 1, title: 'Welcome to AcademiQ!', message: 'Your AI-powered dashboard is ready. Explore predictions and insights.', type: 'success', is_read: false, created_at: new Date().toISOString() },
          { id: 2, title: '⚠ Attendance Alert', message: 'Your attendance in Database Systems dropped to 68%. Attend next 3 classes to avoid penalty.', type: 'warning', is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: 3, title: '🚨 AI Risk Alert', message: 'AI model has flagged you as medium dropout risk. Visit the AI Analytics page for recommendations.', type: 'danger', is_read: false, created_at: new Date(Date.now() - 7200000).toISOString() },
          { id: 4, title: '📈 Score Improving', message: 'Your Machine Learning assignment score improved by 15%. Keep up the good work!', type: 'success', is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: 5, title: '📚 Assignment Deadline', message: 'CS102 — Lab Exercise due in 2 days. Submit before the deadline to avoid penalty.', type: 'info', is_read: true, created_at: new Date(Date.now() - 172800000).toISOString() },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* offline fallback */ 
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
    } catch { /* ignore */ }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const filtered = filter === 'all' ? notifications :
    filter === 'unread' ? notifications.filter(n => !n.is_read) :
    notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Layout title="Notifications">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="glass-card p-6 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(6,182,212,0.1) 100%)' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-glow relative">
              <Bell className="w-7 h-7 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Notifications</h2>
              <p className="text-purple-300/70">{unreadCount} unread • {notifications.length} total</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-300 hover:bg-purple-500/25 transition-all text-sm">
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: `Unread (${unreadCount})` },
            { key: 'warning', label: 'Alerts' },
            { key: 'success', label: 'Success' },
            { key: 'info', label: 'Info' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === key ? 'bg-purple-600 text-white shadow-glow' : 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-4 animate-pulse">
                <div className="h-4 bg-purple-500/20 rounded w-1/3 mb-2" />
                <div className="h-3 bg-purple-500/10 rounded w-2/3" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <Bell className="w-12 h-12 text-purple-500/40 mx-auto mb-3" />
              <p className="text-purple-400">No notifications in this category</p>
            </div>
          ) : (
            filtered.map((notif) => {
              const style = TYPE_STYLES[notif.type] || TYPE_STYLES.info;
              const Icon = style.icon;
              return (
                <div
                  key={notif.id}
                  className={`glass-card p-4 flex items-start gap-4 transition-all cursor-pointer ${!notif.is_read ? 'border-purple-500/30' : 'opacity-70'}`}
                  onClick={() => !notif.is_read && markRead(notif.id)}
                >
                  <div className={`w-10 h-10 rounded-xl ${style.bg} border ${style.border} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${style.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className={`font-semibold text-sm ${notif.is_read ? 'text-purple-300' : 'text-white'}`}>
                        {notif.title}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notif.is_read && (
                          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                        )}
                        <span className="text-xs text-purple-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(notif.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-purple-300/70 leading-relaxed">{notif.message}</p>
                    {!notif.is_read && (
                      <p className="text-xs text-purple-500 mt-1">Click to mark as read</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
