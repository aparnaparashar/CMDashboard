import { useState, useEffect, useRef } from 'react';
import API from '../../api';

export default function CMMobileView({ cmId, cmName, nearbyRef, onViewNearby }) {
  const [complaints,    setComplaints]    = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [heatmapData,   setHeatmapData]   = useState([]);
  const [alertCount,    setAlertCount]    = useState(0);
  const [stats,         setStats]         = useState({ today: 0, completed: 0, pending: 0 });

  // ── Fetch all complaints and derive everything from them ──────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const res  = await API.get('/complaints');
      const data = res.data.data || [];
      setComplaints(data);

      // ── Stats ──────────────────────────────────────────────────────────
      const today     = new Date().toDateString();
      const todayList = data.filter(c => new Date(c.createdAt).toDateString() === today);
      const completed = todayList.filter(c => c.status === 'Resolved').length;
      const pending   = data.filter(c => c.status === 'Pending' || c.status === 'In Progress').length;
      setStats({ today: todayList.length, completed, pending });

      // ── Alert count (escalated) ────────────────────────────────────────
      setAlertCount(data.filter(c => c.status === 'Escalated').length);

      // ── Build heatmap: group active complaints by ward ─────────────────
      const wardMap = {};
      data
        .filter(c => c.status !== 'Resolved')
        .forEach(c => {
          const ward = c.location?.ward || 'Unknown';
          wardMap[ward] = (wardMap[ward] || 0) + 1;
        });

      const maxCount = Math.max(...Object.values(wardMap), 1);
      const cells = Object.entries(wardMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([ward, count]) => ({
          area:          ward,
          complaintCount: count,
          intensity:     Math.round((count / maxCount) * 100),
        }));

      setHeatmapData(cells);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [cmId]);

  // ── Heatmap colour ────────────────────────────────────────────────────────
  const heatColor = (intensity) => {
    if (intensity > 80) return { bg: '#FEE2E2', text: '#DC2626', dot: '#DC2626' };
    if (intensity > 60) return { bg: '#FEF3C7', text: '#D97706', dot: '#F59E0B' };
    if (intensity > 40) return { bg: '#FEF9C3', text: '#CA8A04', dot: '#FCD34D' };
    return { bg: '#F1F5F9', text: '#475569', dot: '#CBD5E1' };
  };

  // ── Scroll to nearby complaints section ──────────────────────────────────
  const handleViewNearby = () => {if (onViewNearby) { onViewNearby(); return; }
    if (nearbyRef?.current) {
      nearbyRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const escalatedList = complaints.filter(c => c.status === 'Escalated');
  const completionRate = stats.today > 0 ? Math.round((stats.completed / stats.today) * 100) : 0;

  return (
    <div style={s.container}>

      {/* Alert Banner */}
      {alertCount > 0 && (
        <div style={s.alertBanner}>
          <div style={s.alertDot} />
          <div>
            <div style={s.alertTitle}>{alertCount} Escalated Complaint{alertCount > 1 ? 's' : ''}</div>
            <div style={s.alertMsg}>Immediate action required</div>
          </div>
        </div>
      )}

      {/* CM Header */}
      <div style={s.cmHeader}>
        <div style={s.cmInfo}>
          <div style={s.cmAvatar}>{cmName?.charAt(0)?.toUpperCase() || 'C'}</div>
          <div>
            <div style={s.cmName}>{cmName || 'CM Officer'}</div>
            <div style={s.cmStatus}>Active on Field</div>
          </div>
        </div>
        <button style={s.refreshBtn} onClick={fetchData} disabled={loading}>
          {loading ? '...' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        {[
          { value: stats.today,     label: "Today's Complaints", sub: 'In your area' },
          { value: stats.completed, label: 'Completed Today',    sub: `${completionRate}% rate` },
          { value: stats.pending,   label: 'Pending Actions',    sub: 'Needs attention' },
        ].map((stat, i) => (
          <div key={i} style={s.statBox}>
            <div style={s.statNum}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
            <div style={s.statSub}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Live Heatmap */}
      <div style={s.section}>
        <div style={s.sectionHead}>
          <div style={s.sectionTitle}>Live Heatmap — Active Complaints by Ward</div>
          <div style={s.sectionSub}>Grouped from registered complaints</div>
        </div>

        {heatmapData.length === 0 ? (
          <div style={s.emptyState}>
            {loading ? 'Loading complaint data...' : 'No active complaints to display'}
          </div>
        ) : (
          <>
            <div style={s.heatGrid}>
              {heatmapData.map((cell, i) => {
                const col = heatColor(cell.intensity);
                return (
                  <div key={i} style={{ ...s.heatCell, background: col.bg }}>
                    <div style={{ ...s.heatDot, background: col.dot }} />
                    <div style={s.heatWard}>{cell.area}</div>
                    <div style={{ ...s.heatCount, color: col.text }}>{cell.complaintCount}</div>
                    <div style={s.heatSub}>complaint{cell.complaintCount !== 1 ? 's' : ''}</div>
                  </div>
                );
              })}
            </div>

            <div style={s.legendRow}>
              {[
                { dot: '#DC2626', label: 'Critical (80+)' },
                { dot: '#F59E0B', label: 'High (60–79)' },
                { dot: '#FCD34D', label: 'Medium (40–59)' },
                { dot: '#CBD5E1', label: 'Low' },
              ].map((l, i) => (
                <div key={i} style={s.legendItem}>
                  <div style={{ ...s.legendDot, background: l.dot }} />
                  <span>{l.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Quick Actions</div>
        <div style={s.actionsGrid}>
          <button style={s.actionBtn} onClick={handleViewNearby}>
            <div style={s.actionIconBox}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F2557" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              </svg>
            </div>
            <span style={s.actionLabel}>View Nearby</span>
          </button>

          <button style={s.actionBtn} onClick={() => window.open('https://www.instagram.com', '_blank', 'noreferrer')}>
            <div style={s.actionIconBox}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F2557" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="#0F2557"/>
              </svg>
            </div>
            <span style={s.actionLabel}>Post on Instagram</span>
          </button>

          <button style={s.actionBtn} onClick={() => window.open('https://x.com', '_blank', 'noreferrer')}>
            <div style={s.actionIconBox}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0F2557">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.73-8.835L1.254 2.25H8.08l4.261 5.636 5.903-5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <span style={s.actionLabel}>Post on X</span>
          </button>

          <button style={s.actionBtn}>
            <div style={s.actionIconBox}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F2557" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 19-7z"/>
              </svg>
            </div>
            <span style={s.actionLabel}>Send Update</span>
          </button>
        </div>
      </div>

      {/* Escalated Complaints */}
      {escalatedList.length > 0 && (
        <div style={s.escalatedSection}>
          <div style={s.escalatedTitle}>Escalated Complaints</div>
          {escalatedList.map((c, i) => (
            <div key={i} style={s.escalatedCard}>
              <div style={s.escalatedTop}>
                <span style={s.escalatedType}>{c.complaintType || c.title || 'Complaint'}</span>
                <span style={s.escalatedBadge}>HIGH</span>
              </div>
              <div style={s.escalatedMeta}>
                {c.citizen?.name}{c.citizen?.phone ? ` · ${c.citizen.phone}` : ''}
              </div>
              {c.location?.ward && (
                <div style={s.escalatedWard}>{c.location.ward}</div>
              )}
              <div style={s.escalatedDate}>
                {new Date(c.createdAt).toLocaleDateString('en-IN')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  container: {
    background: '#F4F6FB',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(15,37,87,0.1)',
    maxWidth: 520,
    margin: '0 auto',
    fontFamily: "'Inter', system-ui, sans-serif",
  },

  // Alert
  alertBanner: {
    background: '#DC2626',
    color: '#fff',
    padding: '12px 16px',
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  alertDot: {
    width: 10, height: 10,
    borderRadius: '50%',
    background: '#fff',
    flexShrink: 0,
    boxShadow: '0 0 0 3px rgba(255,255,255,0.3)',
  },
  alertTitle: { fontSize: 13, fontWeight: 700 },
  alertMsg:   { fontSize: 11, opacity: 0.85, marginTop: 2 },

  // Header
  cmHeader: {
    background: '#fff',
    padding: '14px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #E8EEF8',
  },
  cmInfo:   { display: 'flex', gap: 12, alignItems: 'center' },
  cmAvatar: {
    width: 44, height: 44,
    borderRadius: '50%',
    background: '#0F2557',
    color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, fontWeight: 700,
  },
  cmName:   { fontSize: 14, fontWeight: 700, color: '#0F2557' },
  cmStatus: { fontSize: 11, color: '#16A34A', fontWeight: 600, marginTop: 2 },
  refreshBtn: {
    padding: '6px 14px',
    borderRadius: 8,
    border: '1.5px solid #D8E2F0',
    background: '#fff',
    color: '#0F2557',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },

  // Stats
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    padding: '12px',
    background: '#fff',
    borderBottom: '1px solid #E8EEF8',
  },
  statBox: {
    background: '#F8FAFC',
    borderRadius: 10,
    padding: '12px 8px',
    textAlign: 'center',
  },
  statNum:   { fontSize: 26, fontWeight: 700, color: '#0F2557' },
  statLabel: { fontSize: 10, fontWeight: 700, color: '#0F2557', marginTop: 4, lineHeight: 1.3 },
  statSub:   { fontSize: 10, color: '#94A3B8', marginTop: 3 },

  // Section
  section: {
    background: '#fff',
    padding: '16px',
    borderBottom: '1px solid #E8EEF8',
  },
  sectionHead:  { marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#0F2557', marginBottom: 2 },
  sectionSub:   { fontSize: 11, color: '#94A3B8' },
  emptyState: {
    textAlign: 'center',
    padding: '24px 0',
    color: '#94A3B8',
    fontSize: 13,
  },

  // Heatmap grid
  heatGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    marginBottom: 14,
  },
  heatCell: {
    borderRadius: 10,
    padding: '10px 8px',
    textAlign: 'center',
    position: 'relative',
  },
  heatDot: {
    width: 8, height: 8,
    borderRadius: '50%',
    margin: '0 auto 6px',
  },
  heatWard:  { fontSize: 10, fontWeight: 600, color: '#334155', lineHeight: 1.3, marginBottom: 4, minHeight: 28 },
  heatCount: { fontSize: 22, fontWeight: 700 },
  heatSub:   { fontSize: 9, color: '#94A3B8', marginTop: 2 },

  // Legend
  legendRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 6,
    paddingTop: 12,
    borderTop: '1px solid #F1F5F9',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: '#475569',
  },
  legendDot: {
    width: 10, height: 10,
    borderRadius: '50%',
    flexShrink: 0,
  },

  // Quick actions
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    background: '#F8FAFC',
    border: '1.5px solid #E8EEF8',
    borderRadius: 10,
    padding: '14px 10px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    transition: 'background 0.15s',
  },
  actionIconBox: {
    width: 36, height: 36,
    borderRadius: 10,
    background: '#EEF2FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#0F2557',
  },

  // Escalated
  escalatedSection: {
    background: '#FEF2F2',
    padding: '16px',
    borderTop: '1px solid #FECACA',
  },
  escalatedTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#DC2626',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  escalatedCard: {
    background: '#fff',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 8,
    borderLeft: '3px solid #DC2626',
  },
  escalatedTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  escalatedType:  { fontSize: 12, fontWeight: 700, color: '#0F2557' },
  escalatedBadge: {
    fontSize: 9, fontWeight: 700,
    background: '#DC2626', color: '#fff',
    padding: '2px 7px', borderRadius: 4,
  },
  escalatedMeta: { fontSize: 11, color: '#475569', marginBottom: 2 },
  escalatedWard: { fontSize: 11, color: '#6B7FA3' },
  escalatedDate: { fontSize: 10, color: '#94A3B8', marginTop: 3 },
};