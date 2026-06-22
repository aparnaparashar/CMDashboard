import { useState, useEffect } from 'react';
import API from '../../api';

export default function CMMobileView({ cmId, cmName }) {
  const [mobileStats, setMobileStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [liveHeatmapData, setLiveHeatmapData] = useState([]);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    fetchMobileStats();
    const interval = setInterval(fetchMobileStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [cmId]);

  const fetchMobileStats = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/cm-mobile-stats?cmId=${cmId}`);
      setMobileStats(res.data.data);
      
      // Count critical/escalated complaints as alerts
      const alerts = res.data.data?.escalatedComplaints?.length || 0;
      setAlertCount(alerts);
      
      // Fetch heatmap data
      const heatRes = await API.get(`/heatmap?cmId=${cmId}`);
      setLiveHeatmapData(heatRes.data.data || []);
    } catch (err) {
      console.error('Error fetching mobile stats:', err);
    }
    setLoading(false);
  };

  const handleUploadPhotos = () => {
    window.open('https://www.instagram.com/officialrekhagupta/?hl=en', '_blank', 'noreferrer');
  };
  const handleCheckIn = () => {
    window.open('https://x.com/CMODelhi', '_blank', 'noreferrer');
  };

  const getHeatmapColor = (intensity) => {
    if (intensity > 80) return '#DC2626'; // Red
    if (intensity > 60) return '#F59E0B'; // Orange
    if (intensity > 40) return '#FCD34D'; // Yellow
    return '#D1D5DB'; // Gray
  };

  return (
    <div style={styles.mobileContainer}>
      {/* Red Alert Banner */}
      {alertCount > 0 && (
        <div style={styles.alertBanner}>
          <span style={styles.alertIcon}>!</span>
          <div>
            <div style={styles.alertTitle}>
              ▲ {alertCount} Escalated Complaint{alertCount > 1 ? 's' : ''}
            </div>
            <div style={styles.alertMessage}>
              Immediate action required - Check your dashboard
            </div>
          </div>
        </div>
      )}

      {/* CM Header */}
      <div style={styles.cmHeader}>
        <div style={styles.cmInfo}>
          <div style={styles.cmAvatar}>{cmName?.charAt(0)?.toUpperCase() || 'CM'}</div>
          <div>
            <div style={styles.cmName}>{cmName || 'CM Officer'}</div>
            <div style={styles.cmStatus}>Active on Field</div>
          </div>
        </div>
        <button style={styles.refreshBtn} onClick={fetchMobileStats}>
          ⟳
        </button>
      </div>

      {/* 3-Stat Summary */}
      {mobileStats && (
        <div style={styles.statsSummary}>
          <div style={styles.statBox}>
            <div style={styles.statNumber}>{mobileStats.todayComplaints || 0}</div>
            <div style={styles.statLabel}>Today's Complaints</div>
            <div style={styles.statSubtext}>In your area</div>
          </div>
          
          <div style={styles.statBox}>
            <div style={styles.statNumber}>{mobileStats.completedToday || 0}</div>
            <div style={styles.statLabel}>Completed Today</div>
            <div style={styles.statSubtext}>{mobileStats.completionRate || 0}% rate</div>
          </div>
          
          <div style={styles.statBox}>
            <div style={styles.statNumber}>{mobileStats.pendingComplaints || 0}</div>
            <div style={styles.statLabel}>Pending Actions</div>
            <div style={styles.statSubtext}>Urgent items</div>
          </div>
        </div>
      )}

      {/* Live Heatmap */}
      <div style={styles.heatmapContainer}>
        <div style={styles.heatmapHeader}>
          <h3 style={styles.heatmapTitle}>◆ LIVE HEATMAP - Active Complaints</h3>
          <span style={styles.heatmapLegend}>
            More complaints = Hotter color
          </span>
        </div>

        {liveHeatmapData.length === 0 ? (
          <div style={styles.emptyHeatmap}>No heatmap data available</div>
        ) : (
          <div style={styles.heatmapGrid}>
            {liveHeatmapData.map((cell, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.heatmapCell,
                  background: getHeatmapColor(cell.intensity),
                  border: cell.intensity > 60 ? '2px solid #8B5CF6' : 'none',
                }}
                title={`${cell.area}: ${cell.complaintCount} complaints`}
              >
                <div style={styles.cellLabel}>{cell.area}</div>
                <div style={styles.cellCount}>{cell.complaintCount}</div>
              </div>
            ))}
          </div>
        )}

        <div style={styles.heatmapLegendBox}>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, background: '#DC2626' }}></div>
            <span>Critical (80+)</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, background: '#F59E0B' }}></div>
            <span>High (60-79)</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, background: '#FCD34D' }}></div>
            <span>Medium (40-59)</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendColor, background: '#D1D5DB' }}></div>
            <span>Low</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.quickActionsContainer}>
        <h3 style={styles.actionTitle}>Quick Actions</h3>
        <div style={styles.actionButtons}>
          <button style={styles.actionBtn}>
            <span style={styles.actionIcon}>◆</span>
            <span>View Nearby</span>
          </button>
          <button style={styles.actionBtn} onClick={handleUploadPhotos}>
            <span style={styles.actionIcon}>◇</span>
            <span>Post on Instagram</span>
          </button>
          <button style={styles.actionBtn} onClick={handleCheckIn}>
            <span style={styles.actionIcon}>●</span>
            <span>Post on Twitter</span>
          </button>
          <button style={styles.actionBtn}>
            <span style={styles.actionIcon}>◉</span>
            <span>Send Update</span>
          </button>
        </div>
      </div>

      {/* Escalated Complaints List */}
      {mobileStats?.escalatedComplaints?.length > 0 && (
        <div style={styles.escalatedSection}>
          <h3 style={styles.sectionTitle}>▲ ESCALATED COMPLAINTS</h3>
          {mobileStats.escalatedComplaints.map((complaint, idx) => (
            <div key={idx} style={styles.escalatedCard}>
              <div style={styles.escalatedHeader}>
                <span style={styles.escalatedType}>{complaint.complaintType}</span>
                <span style={styles.escalatedPriority}>HIGH</span>
              </div>
              <div style={styles.escalatedDetails}>
                {complaint.citizen?.name} • {complaint.citizen?.phone}
              </div>
              <div style={styles.escalatedDate}>
                Escalated: {new Date(complaint.escalatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  mobileContainer: {
    background: '#F4F6FB',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(15,37,87,0.1)',
    maxWidth: 500,
    margin: '0 auto',
  },
  alertBanner: {
    background: 'linear-gradient(135deg, #DC2626 0%, #8B5CF6 100%)',
    color: '#fff',
    padding: 16,
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  alertIcon: {
    fontSize: 24,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 12,
    opacity: 0.9,
  },
  cmHeader: {
    background: '#fff',
    padding: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #E8EEF8',
  },
  cmInfo: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  cmAvatar: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: '#0F2557',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    fontWeight: 700,
  },
  cmName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0F2557',
  },
  cmStatus: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: 600,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '1px solid #E8EEF8',
    background: '#F8FAFC',
    cursor: 'pointer',
    fontSize: 18,
  },
  statsSummary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    padding: 12,
    background: '#fff',
  },
  statBox: {
    background: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 700,
    color: '#0F2557',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#0F2557',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 10,
    color: '#9EB3CC',
  },
  heatmapContainer: {
    padding: 16,
    background: '#fff',
    borderBottom: '1px solid #E8EEF8',
  },
  heatmapHeader: {
    marginBottom: 12,
  },
  heatmapTitle: {
    margin: '0 0 4px 0',
    fontSize: 14,
    fontWeight: 700,
    color: '#0F2557',
  },
  heatmapLegend: {
    fontSize: 11,
    color: '#6B7FA3',
  },
  emptyHeatmap: {
    textAlign: 'center',
    padding: '20px',
    color: '#9EB3CC',
    fontSize: 13,
  },
  heatmapGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
    marginBottom: 12,
  },
  heatmapCell: {
    padding: 8,
    borderRadius: 6,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  cellLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#0F2557',
  },
  cellCount: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0F2557',
    marginTop: 2,
  },
  heatmapLegendBox: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
    paddingTop: 12,
    borderTop: '1px solid #E8EEF8',
  },
  legendItem: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    fontSize: 11,
    color: '#3A4E70',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  quickActionsContainer: {
    padding: 16,
    background: '#fff',
    borderBottom: '1px solid #E8EEF8',
  },
  actionTitle: {
    margin: '0 0 12px 0',
    fontSize: 13,
    fontWeight: 700,
    color: '#0F2557',
  },
  actionButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  },
  actionBtn: {
    background: '#EEF2FF',
    border: '1px solid #BFDBFE',
    borderRadius: 8,
    padding: 12,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.3s ease',
  },
  actionIcon: {
    fontSize: 18,
  },
  escalatedSection: {
    padding: 16,
    background: '#FEE2E2',
    borderTop: '1px solid #FCA5A5',
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: 13,
    fontWeight: 700,
    color: '#DC2626',
  },
  escalatedCard: {
    background: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeft: '3px solid #DC2626',
  },
  escalatedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  escalatedType: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0F2557',
  },
  escalatedPriority: {
    fontSize: 10,
    fontWeight: 700,
    background: '#DC2626',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: 4,
  },
  escalatedDetails: {
    fontSize: 11,
    color: '#3A4E70',
    marginBottom: 4,
  },
  escalatedDate: {
    fontSize: 10,
    color: '#6B7FA3',
  },
};
