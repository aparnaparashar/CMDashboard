import { useState, useEffect } from 'react';
import API from '../../api';

export default function VisitLogs({ cmId }) {
  const [visitLogs, setVisitLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState(null);
  const [filter, setFilter] = useState('all'); // all, today, week, month

  useEffect(() => {
    if (cmId) {
      fetchVisitLogs();
    }
  }, [cmId, filter]);

  const fetchVisitLogs = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/visit-logs?cmId=${cmId}&filter=${filter}`);
      setVisitLogs(res.data.data || []);
    } catch (err) {
      console.error('Error fetching visit logs:', err);
    }
    setLoading(false);
  };

  const getOutcomeColor = (outcome) => {
    switch(outcome) {
      case 'Resolved': return '#16A34A';
      case 'In Progress': return '#F59E0B';
      case 'Escalated': return '#8B5CF6';
      case 'Pending': return '#3B82F6';
      default: return '#6B7FA3';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (startTime, endTime) => {
    if (!endTime) return 'Ongoing';
    const diff = new Date(endTime) - new Date(startTime);
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>◉ CM Visit Logs</h3>
        <div style={styles.filterButtons}>
          {['all', 'today', 'week', 'month'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...styles.filterBtn,
                background: filter === f ? '#0F2557' : '#E8EEF8',
                color: filter === f ? '#fff' : '#0F2557',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingText}>Loading visit logs...</div>
      ) : visitLogs.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={{ fontSize: 32 }}>◆</span>
          <p>No visit logs found</p>
        </div>
      ) : (
        <div style={styles.logsList}>
          {visitLogs.map((log, idx) => (
            <div
              key={log._id || idx}
              style={{
                ...styles.logCard,
                borderLeft: `4px solid ${getOutcomeColor(log.outcome)}`,
                background: expandedLog === log._id ? '#EEF2FF' : '#F8FAFC',
              }}
              onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
            >
              <div style={styles.logHeader}>
                <div>
                  <div style={styles.logDate}>
                    ◉ {formatDate(log.visitDate)}
                  </div>
                  <div style={styles.logArea}>
                    ◆ Area: <strong>{log.area || 'Not specified'}</strong>
                  </div>
                </div>
                <div style={{
                  ...styles.outcomeBadge,
                  background: getOutcomeColor(log.outcome) + '20',
                  color: getOutcomeColor(log.outcome),
                }}>
                  {log.outcome}
                </div>
              </div>

              {expandedLog === log._id && (
                <div style={styles.expandedContent}>
                  <div style={styles.detailsGrid}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>⟳ DURATION</span>
                      <span style={styles.detailValue}>
                        {calculateDuration(log.startTime, log.endTime)}
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>◉ COUNT</span>
                      <span style={styles.detailValue}>{log.complaintsHandled?.length || 0}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>✓ RESOLVED</span>
                      <span style={styles.detailValue}>
                        {log.complaintsHandled?.filter(c => c.status === 'Resolved').length || 0}
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>◐ IN PROGRESS</span>
                      <span style={styles.detailValue}>
                        {log.complaintsHandled?.filter(c => c.status === 'In Progress').length || 0}
                      </span>
                    </div>
                  </div>

                  {log.complaintsHandled && log.complaintsHandled.length > 0 && (
                    <div style={styles.complaintsSection}>
                      <div style={styles.sectionTitle}>Complaints Handled</div>
                      {log.complaintsHandled.map((complaint, i) => (
                        <div key={i} style={styles.complaintItem}>
                          <span style={styles.complaintType}>
                            {complaint.complaintType}
                          </span>
                          <span style={{
                            ...styles.complaintStatus,
                            color: getOutcomeColor(complaint.status),
                          }}>
                            {complaint.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {log.areaSummary && (
                    <div style={styles.areaSummarySection}>
                      <div style={styles.sectionTitle}>Area Summary</div>
                      <p style={styles.summaryText}>{log.areaSummary}</p>
                    </div>
                  )}

                  {log.notes && (
                    <div style={styles.notesSection}>
                      <div style={styles.sectionTitle}>Officer Notes</div>
                      <p style={styles.notesText}>{log.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: '#fff',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 2px 8px rgba(15,37,87,0.06)',
    marginBottom: 24,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: '1px solid #E8EEF8',
    flexWrap: 'wrap',
    gap: 12,
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#0F2557',
  },
  filterButtons: {
    display: 'flex',
    gap: 8,
  },
  filterBtn: {
    padding: '6px 12px',
    border: '1px solid #D8E2F0',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  loadingText: {
    textAlign: 'center',
    padding: '20px',
    color: '#6B7FA3',
    fontSize: 14,
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#9EB3CC',
  },
  logsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  logCard: {
    background: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logDate: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0F2557',
    marginBottom: 6,
  },
  logArea: {
    fontSize: 13,
    color: '#3A4E70',
  },
  outcomeBadge: {
    fontSize: 12,
    fontWeight: 700,
    padding: '6px 12px',
    borderRadius: 12,
    whiteSpace: 'nowrap',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: '1px solid #D8E2F0',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 12,
    marginBottom: 16,
  },
  detailItem: {
    background: '#fff',
    padding: 12,
    borderRadius: 6,
    border: '1px solid #E8EEF8',
  },
  detailLabel: {
    fontSize: 11,
    color: '#6B7FA3',
    fontWeight: 600,
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 700,
    color: '#0F2557',
  },
  complaintsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0F2557',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  complaintItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #E8EEF8',
    fontSize: 13,
  },
  complaintType: {
    color: '#3A4E70',
    fontWeight: 500,
  },
  complaintStatus: {
    fontWeight: 700,
  },
  areaSummarySection: {
    marginBottom: 12,
    padding: 12,
    background: '#FFFBEB',
    borderRadius: 6,
    border: '1px solid #FCD34D',
  },
  summaryText: {
    margin: 0,
    fontSize: 13,
    color: '#3A4E70',
    lineHeight: 1.6,
  },
  notesSection: {
    padding: 12,
    background: '#EEF2FF',
    borderRadius: 6,
    border: '1px solid #BFDBFE',
  },
  notesText: {
    margin: 0,
    fontSize: 13,
    color: '#3A4E70',
    lineHeight: 1.6,
    fontStyle: 'italic',
  },
};
