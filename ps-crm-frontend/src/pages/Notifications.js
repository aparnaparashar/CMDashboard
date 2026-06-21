import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang, tx } from '../context/LanguageContext.jsx';
import LanguageToggle from '../components/layout/LanguageToggle';
import API from '../api';
import HeaderNavbar from '../components/layout/HeaderNavbar';

// ── Time helper ───────────────────────────────────────────────────────────────
function timeAgo(date, lang) {
  const diff  = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (lang === 'hi') {
    if (mins  < 60) return `${mins} मिनट पहले`;
    if (hours < 24) return `${hours} घंटे पहले`;
    if (days  < 7)  return `${days} दिन पहले`;
    return new Date(date).toLocaleDateString('hi-IN');
  }

  if (mins  < 60) return `${mins} minute${mins  !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours  !== 1 ? 's' : ''} ago`;
  if (days  < 7)  return `${days} day${days     !== 1 ? 's' : ''} ago`;
  return new Date(date).toLocaleDateString('en-IN');
}

// ── Convert complaints  notification objects ─────────────────────────────────
function complaintsToNotifications(complaints, lang) {
  const notifs = [];

  complaints.forEach(c => {
    const id    = c._id;
    const title = c.title;
    const date  = new Date(c.updatedAt || c.createdAt);

    // Submission
    notifs.push({
      id: `${id}-submitted`,
      complaintId: id,
      type: 'status',
      icon: '',
      title: tx('Complaint Registered', lang),
      message: lang === 'hi'
        ? `आपकी शिकायत "${title}" सफलतापूर्वक जमा की गई। आईडी: ${id.slice(-8).toUpperCase()}`
        : `Your complaint "${title}" was submitted successfully. ID: ${id.slice(-8).toUpperCase()}`,
      time: timeAgo(new Date(c.createdAt), lang),
      read: false,
      color: '#0F2557',
      bg: '#EEF2FF',
    });

    // In Progress
    if (c.status === 'In Progress') {
      notifs.push({
        id: `${id}-inprogress`,
        complaintId: id,
        type: 'status',
        icon: '',
        title: tx('Complaint In Progress', lang),
        message: lang === 'hi'
          ? `आपकी शिकायत "${title}" पर अधिकारी काम कर रहे हैं।`
          : `Your complaint "${title}" is now being worked on by an officer.`,
        time: timeAgo(date, lang),
        read: false,
        color: '#2563EB',
        bg: '#DBEAFE',
      });
    }

    // Resolved
    if (c.status === 'Resolved') {
      notifs.push({
        id: `${id}-resolved`,
        complaintId: id,
        type: 'resolved',
        icon: '',
        title: tx('Complaint Resolved', lang),
        message: lang === 'hi'
          ? `आपकी शिकायत "${title}" हल की गई।${c.resolution ? ` नोट: ${c.resolution}` : ' कृपया अपना अनुभव रेट करें।'}`
          : `Your complaint "${title}" has been resolved.${c.resolution ? ` Note: ${c.resolution}` : ' Please rate your experience.'}`,
        time: timeAgo(date, lang),
        read: false,
        color: '#16A34A',
        bg: '#DCFCE7',
      });
    }

    // Escalated
    if (c.status === 'Escalated' || c.sla?.escalated) {
      notifs.push({
        id: `${id}-escalated`,
        complaintId: id,
        type: 'escalated',
        icon: '',
        title: tx('Complaint Escalated', lang),
        message: lang === 'hi'
          ? `शिकायत "${title}" SLA उल्लंघन के कारण एस्केलेट की गई है।`
          : `Complaint "${title}" has been escalated due to SLA breach.`,
        time: timeAgo(date, lang),
        read: false,
        color: '#DC2626',
        bg: '#FEE2E2',
      });
    }

    // Rejected
    if (c.status === 'Rejected') {
      notifs.push({
        id: `${id}-rejected`,
        complaintId: id,
        type: 'status',
        icon: '',
        title: tx('Complaint Rejected', lang),
        message: lang === 'hi'
          ? `आपकी शिकायत "${title}" अस्वीकृत की गई।${c.resolution ? ` कारण: ${c.resolution}` : ''}`
          : `Your complaint "${title}" was rejected.${c.resolution ? ` Reason: ${c.resolution}` : ''}`,
        time: timeAgo(date, lang),
        read: false,
        color: '#DC2626',
        bg: '#FEE2E2',
      });
    }
  });

  return notifs.sort((a, b) => new Date(b.time) - new Date(a.time));
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Notifications() {
  const navigate      = useNavigate();
  const { user, logout } = useAuth();
  const { lang }      = useLang();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [filter, setFilter]               = useState('all');

  useEffect(() => {
    const endpoint = user?.role === 'citizen' ? '/complaints/my' : '/complaints';
    API.get(endpoint)
      .then(res => {
        const notifs = complaintsToNotifications(res.data.data || [], lang);
        setNotifications(notifs);
      })
      .catch(() => setError(lang === 'hi' ? 'सूचनाएं लोड नहीं हो सकीं।' : 'Failed to load notifications.'))
      .finally(() => setLoading(false));
  }, [user, lang]);

  const unread = notifications.filter(n => !n.read).length;

  const filtered = filter === 'all'     ? notifications
    : filter === 'unread'               ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.type === filter);

  const markRead    = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = ()   => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const deleteNotif = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  const dashPath = user?.role === 'admin'   ? '/admin/dashboard'
    : user?.role === 'officer'              ? '/officer/dashboard'
    : '/citizen/dashboard';

  // Topbar subtitle
  const subText = loading ? tx('Loading...', lang)
    : error   ? error
    : unread > 0
      ? lang === 'hi'
        ? `आपके पास ${unread} अपठित ${unread !== 1 ? 'सूचनाएं' : 'सूचना'} हैं`
        : `You have ${unread} unread notification${unread !== 1 ? 's' : ''}`
      : tx("All caught up!", lang);

  // User role label
  const roleLabel = user?.role === 'admin'   ? tx('🏛️ Administrator', lang)
    : user?.role === 'officer'               ? `🧑‍💼 ${tx('Field Officer', lang)}`
    : `👤 ${tx('Citizen', lang)}`;

  return (
    <div style={styles.page}>
      <HeaderNavbar activeTab="notifications" />

      {/* Main */}
      <div style={styles.main}>
        {/* Topbar */}
        <div style={styles.topbar}>
          <div>
            <h1 style={styles.pageTitle}>{tx(' Notifications', lang)}</h1>
            <p style={styles.pageSub}>{subText}</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <LanguageToggle style={{ border: '1.5px solid #0F2557', background: 'rgba(15,37,87,0.07)', color: '#0F2557' }} />
            {unread > 0 && (
              <button style={styles.btnMarkAll} onClick={markAllRead}>
                {tx(' Mark All Read', lang)}
              </button>
            )}
            <div style={styles.adminChip}>
              <div style={styles.chipAvatar}>{user?.name?.charAt(0)}</div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={styles.filterRow}>
          {[
            { key: 'all',       label: `${tx('All', lang)} (${notifications.length})` },
            { key: 'unread',    label: `${tx('Unread', lang)} (${unread})` },
            { key: 'resolved',  label: tx(' Resolved', lang) },
            { key: 'status',    label: tx(' Status Updates', lang) },
            { key: 'escalated', label: tx(' Escalated', lang) },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ ...styles.filterBtn, ...(filter === f.key ? styles.filterBtnActive : {}) }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={styles.listCard}>
          {loading ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 40, marginBottom: 12 }}></div>
              <div style={{ color: '#6B7FA3' }}>{tx('Loading...', lang)}</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 56, marginBottom: 16 }}></div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0F2557', marginBottom: 8 }}>
                {tx('No notifications', lang)}
              </div>
              <div style={{ color: '#6B7FA3', fontSize: 14 }}>{tx("You're all caught up!", lang)}</div>
            </div>
          ) : (
            filtered.map(n => (
              <div key={n.id}
                style={{
                  ...styles.notifRow,
                  background:  n.read ? '#fff' : '#F8FAFF',
                  borderLeft: n.read ? '3px solid transparent' : `3px solid ${n.color}`,
                }}
                onClick={() => markRead(n.id)}>
                <div style={{ ...styles.notifIcon, background: n.bg, color: n.color }}>{n.icon}</div>
                <div style={styles.notifContent}>
                  <div style={styles.notifHeader}>
                    <span style={{ ...styles.notifTitle, fontWeight: n.read ? 600 : 700 }}>{n.title}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={styles.notifTime}>{n.time}</span>
                      {!n.read && <span style={styles.unreadDot} />}
                      <button style={styles.deleteBtn}
                        onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}></button>
                    </div>
                  </div>
                  <div style={styles.notifMsg}>{n.message}</div>

                  {/* Action buttons */}
                  {n.type === 'resolved' && (
                    <button style={styles.actionBtn}
                      onClick={e => { e.stopPropagation(); navigate(`/citizen/feedback/${n.complaintId}`); }}>
                      {tx(' Give Feedback ', lang)}
                    </button>
                  )}
                  {n.type === 'status' && (
                    <button style={{ ...styles.actionBtn, background: '#DBEAFE', color: '#2563EB' }}
                      onClick={e => { e.stopPropagation(); navigate('/citizen/track'); }}>
                      {tx(' Track Complaint ', lang)}
                    </button>
                  )}
                  {n.type === 'escalated' && (
                    <button style={{ ...styles.actionBtn, background: '#FEE2E2', color: '#DC2626' }}
                      onClick={e => { e.stopPropagation(); navigate('/citizen/track'); }}>
                      {tx(' View Complaint ', lang)}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page:            { background: '#F4F6FB', minHeight: '100vh', fontFamily: "'DM Sans',sans-serif" },
  main:            { maxWidth: 1240, margin: '0 auto', padding: '40px 40px 60px', background: '#F4F6FB', minHeight: 'calc(100vh - 150px)', boxSizing: 'border-box' },
  topbar:          { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #E8EEF8' },
  pageTitle:       { fontFamily: "'Noto Serif',serif", fontSize: 24, fontWeight: 700, color: '#0F2557' },
  pageSub:         { color: '#6B7FA3', fontSize: 13, marginTop: 4 },
  btnMarkAll:      { padding: '8px 18px', border: '1.5px solid #16A34A', borderRadius: 8, background: '#DCFCE7', color: '#16A34A', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  adminChip:       { display: 'flex', alignItems: 'center', gap: 8, background: '#fff', padding: '6px 14px', borderRadius: 20, boxShadow: '0 2px 8px rgba(15,37,87,0.08)' },
  chipAvatar:      { width: 28, height: 28, borderRadius: '50%', background: '#0F2557', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 },
  filterRow:       { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  filterBtn:       { padding: '7px 16px', borderRadius: 20, border: '1.5px solid #D8E2F0', background: '#fff', color: '#6B7FA3', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  filterBtnActive: { background: '#0F2557', color: '#fff', border: '1.5px solid #0F2557' },
  listCard:        { background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(15,37,87,0.06)', overflow: 'hidden' },
  notifRow:        { display: 'flex', gap: 16, padding: '18px 24px', borderBottom: '1px solid #F0F4FB', cursor: 'pointer' },
  notifIcon:       { width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
  notifContent:    { flex: 1 },
  notifHeader:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  notifTitle:      { fontSize: 14, color: '#0F2557' },
  notifTime:       { fontSize: 12, color: '#9EB3CC' },
  unreadDot:       { width: 8, height: 8, borderRadius: '50%', background: '#E8620A' },
  deleteBtn:       { width: 24, height: 24, borderRadius: '50%', border: 'none', background: '#F0F4FB', color: '#9EB3CC', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  notifMsg:        { fontSize: 13, color: '#6B7FA3', lineHeight: 1.6 },
  actionBtn:       { marginTop: 10, padding: '5px 14px', borderRadius: 6, border: 'none', background: '#DCFCE7', color: '#16A34A', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  emptyState:      { textAlign: 'center', padding: '80px 20px' },
};