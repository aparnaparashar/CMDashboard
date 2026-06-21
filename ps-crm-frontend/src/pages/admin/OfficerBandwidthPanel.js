import { useState, useEffect } from 'react';
import API from '../../api';

export default function OfficerBandwidthPanel() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOfficer, setExpandedOfficer] = useState(null);
  const [sortBy, setSortBy] = useState('load'); // load, performance, name

  useEffect(() => {
    fetchOfficerBandwidth();
    const interval = setInterval(fetchOfficerBandwidth, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [sortBy]);

  const fetchOfficerBandwidth = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/officers-bandwidth?sortBy=${sortBy}`);
      let data = res.data.data || [];
      
      // Sort based on selected criteria
      if (sortBy === 'load') {
        data.sort((a, b) => b.activeComplaints - a.activeComplaints);
      } else if (sortBy === 'performance') {
        data.sort((a, b) => b.completionRate - a.completionRate);
      } else {
        data.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      setOfficers(data);
    } catch (err) {
      console.error('Error fetching officer bandwidth:', err);
    }
    setLoading(false);
  };

  const getLoadLevel = (activeComplaints, maxCapacity = 15) => {
    const percentage = (activeComplaints / maxCapacity) * 100;
    if (percentage > 85) return { level: 'Critical', color: '#DC2626' };
    if (percentage > 65) return { level: 'High', color: '#F59E0B' };
    if (percentage > 40) return { level: 'Medium', color: '#FCD34D' };
    return { level: 'Low', color: '#16A34A' };
  };

  const getPerformanceColor = (rate) => {
    if (rate >= 90) return '#16A34A'; // Green
    if (rate >= 75) return '#F59E0B'; // Orange
    if (rate >= 60) return '#3B82F6'; // Blue
    return '#DC2626'; // Red
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>⟳ Officer Bandwidth Panel</h3>
          <p style={styles.subtitle}>Monitor active load and performance to prevent unfair assignment</p>
        </div>
        <div style={styles.sortButtons}>
          {['load', 'performance', 'name'].map(sort => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              style={{
                ...styles.sortBtn,
                background: sortBy === sort ? '#0F2557' : '#E8EEF8',
                color: sortBy === sort ? '#fff' : '#0F2557',
              }}
              title={`Sort by ${sort}`}
            >
              {sort === 'load' && '◆'}
              {sort === 'performance' && '◉'}
              {sort === 'name' && '◐'}
              {` ${sort.charAt(0).toUpperCase() + sort.slice(1)}`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingText}>Loading officer data...</div>
      ) : officers.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={{ fontSize: 32 }}>◐</span>
          <p>No officers available</p>
        </div>
      ) : (
        <div style={styles.officersList}>
          {officers.map((officer) => {
            const loadInfo = getLoadLevel(officer.activeComplaints);
            const performanceColor = getPerformanceColor(officer.completionRate);
            const isOverloaded = loadInfo.level === 'Critical' || loadInfo.level === 'High';

            return (
              <div
                key={officer._id}
                style={{
                  ...styles.officerCard,
                  borderLeft: `4px solid ${loadInfo.color}`,
                  background: isOverloaded ? '#FEE2E2' : '#fff',
                }}
                onClick={() => setExpandedOfficer(
                  expandedOfficer === officer._id ? null : officer._id
                )}
              >
                {isOverloaded && (
                  <div style={styles.overloadWarning}>
                    ▲ OVERLOADED - Consider reassigning tasks
                  </div>
                )}

                <div style={styles.officerHeader}>
                  <div style={styles.officerInfo}>
                    <div style={styles.officerAvatar}>
                      {officer.name?.charAt(0)?.toUpperCase() || 'O'}
                    </div>
                    <div>
                      <div style={styles.officerName}>{officer.name}</div>
                      <div style={styles.officerPhone}>
                        ◉ {officer.phone || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div style={styles.expandIcon}>
                    {expandedOfficer === officer._id ? '▼' : '▶'}
                  </div>
                </div>

                <div style={styles.quickStats}>
                  <div style={styles.quickStat}>
                    <span style={styles.quickStatLabel}>Active Load</span>
                    <span style={{
                      ...styles.quickStatValue,
                      color: loadInfo.color,
                    }}>
                      {officer.activeComplaints}/15
                    </span>
                  </div>
                  <div style={styles.quickStat}>
                    <span style={styles.quickStatLabel}>Performance</span>
                    <span style={{
                      ...styles.quickStatValue,
                      color: performanceColor,
                    }}>
                      {officer.completionRate || 0}%
                    </span>
                  </div>
                  <div style={{
                    ...styles.loadBar,
                    background: `linear-gradient(to right, ${loadInfo.color} ${Math.min((officer.activeComplaints/15)*100, 100)}%, #E8EEF8 ${Math.min((officer.activeComplaints/15)*100, 100)}%)`,
                  }}></div>
                </div>

                {expandedOfficer === officer._id && (
                  <div style={styles.expandedContent}>
                    {/* Load Details */}
                    <div style={styles.section}>
                      <div style={styles.sectionTitle}>Load Details</div>
                      <div style={styles.detailsGrid}>
                        <div style={styles.detailBox}>
                          <span style={styles.detailLabel}>Total Assigned</span>
                          <span style={styles.detailValue}>{officer.totalAssigned || 0}</span>
                        </div>
                        <div style={styles.detailBox}>
                          <span style={styles.detailLabel}>Active Now</span>
                          <span style={styles.detailValue}>{officer.activeComplaints || 0}</span>
                        </div>
                        <div style={styles.detailBox}>
                          <span style={styles.detailLabel}>Capacity Used</span>
                          <span style={{
                            ...styles.detailValue,
                            color: loadInfo.color,
                          }}>
                            {Math.round((officer.activeComplaints/15)*100)}%
                          </span>
                        </div>
                        <div style={styles.detailBox}>
                          <span style={styles.detailLabel}>Avg. Time</span>
                          <span style={styles.detailValue}>
                            {officer.avgResolutionTime || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Stats */}
                    <div style={styles.section}>
                      <div style={styles.sectionTitle}>Performance Metrics</div>
                      <div style={styles.performanceGrid}>
                        <div style={styles.perfItem}>
                          <span style={styles.perfLabel}>Completion Rate</span>
                          <div style={styles.perfBar}>
                            <div style={{
                              ...styles.perfBarFill,
                              width: `${officer.completionRate || 0}%`,
                              background: performanceColor,
                            }}></div>
                          </div>
                          <span style={styles.perfValue}>
                            {officer.completionRate || 0}%
                          </span>
                        </div>

                        <div style={styles.perfItem}>
                          <span style={styles.perfLabel}>Customer Rating</span>
                          <div style={styles.ratingStars}>
                            {[1, 2, 3, 4, 5].map(star => (
                              <span
                                key={star}
                                style={{
                                  fontSize: 16,
                                  color: star <= Math.round(officer.customerRating || 0)
                                    ? '#FCD34D'
                                    : '#E5E7EB',
                                }}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span style={styles.perfValue}>
                            {(officer.customerRating || 0).toFixed(1)}/5
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div style={styles.section}>
                      <div style={styles.sectionTitle}>Contact Information</div>
                      <div style={styles.contactInfo}>
                        <p><strong>Email:</strong> {officer.email || 'N/A'}</p>
                        <p><strong>Phone:</strong> {officer.phone || 'N/A'}</p>
                        <p><strong>Ward/Area:</strong> {officer.area || 'N/A'}</p>
                        <p><strong>Last Active:</strong> {formatDate(officer.lastActive)}</p>
                      </div>
                    </div>

                    {/* Recommendation */}
                    {isOverloaded && (
                      <div style={styles.recommendationBox}>
                        <div style={styles.recommendationTitle}>⚡ Recommendation</div>
                        <p style={styles.recommendationText}>
                          This officer is currently overloaded. Consider redistributing {officer.activeComplaints - 10} complaint(s) to maintain work-life balance and quality of service.
                        </p>
                        <button style={styles.reassignBtn}>
                          👥 View Reassignment Options
                        </button>
                      </div>
                    )}

                    {/* Recent Activity */}
                    {officer.recentActivity && officer.recentActivity.length > 0 && (
                      <div style={styles.section}>
                        <div style={styles.sectionTitle}>Recent Activity</div>
                        <div style={styles.activityList}>
                          {officer.recentActivity.slice(0, 3).map((activity, idx) => (
                            <div key={idx} style={styles.activityItem}>
                              <span style={styles.activityTime}>
                                {new Date(activity.timestamp).toLocaleTimeString('en-IN')}
                              </span>
                              <span style={styles.activityDescription}>
                                {activity.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: '1px solid #E8EEF8',
    gap: 20,
    flexWrap: 'wrap',
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: 16,
    fontWeight: 700,
    color: '#0F2557',
  },
  subtitle: {
    margin: 0,
    fontSize: 12,
    color: '#6B7FA3',
  },
  sortButtons: {
    display: 'flex',
    gap: 8,
  },
  sortBtn: {
    padding: '8px 12px',
    border: '1px solid #D8E2F0',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
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
  officersList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 16,
  },
  officerCard: {
    background: '#fff',
    borderRadius: 8,
    border: '1px solid #E8EEF8',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  overloadWarning: {
    background: '#DC2626',
    color: '#fff',
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 700,
    textAlign: 'center',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  officerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottom: '1px solid #E8EEF8',
  },
  officerInfo: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  officerAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#0F2557',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 700,
  },
  officerName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0F2557',
  },
  officerPhone: {
    fontSize: 11,
    color: '#6B7FA3',
    marginTop: 2,
  },
  expandIcon: {
    fontSize: 12,
    color: '#9EB3CC',
    fontWeight: 700,
  },
  quickStats: {
    padding: '12px 16px',
    background: '#F8FAFC',
    borderBottom: '1px solid #E8EEF8',
  },
  quickStat: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    fontSize: 12,
  },
  quickStatLabel: {
    color: '#6B7FA3',
    fontWeight: 600,
  },
  quickStatValue: {
    fontSize: 14,
    fontWeight: 700,
  },
  loadBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  expandedContent: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0F2557',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  },
  detailBox: {
    background: '#F8FAFC',
    padding: 10,
    borderRadius: 6,
    border: '1px solid #E8EEF8',
  },
  detailLabel: {
    fontSize: 10,
    color: '#6B7FA3',
    fontWeight: 600,
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0F2557',
  },
  performanceGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  perfItem: {
    background: '#F8FAFC',
    padding: 10,
    borderRadius: 6,
  },
  perfLabel: {
    fontSize: 11,
    color: '#6B7FA3',
    fontWeight: 600,
    display: 'block',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  perfBar: {
    height: 6,
    background: '#E8EEF8',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  perfBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  perfValue: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0F2557',
  },
  ratingStars: {
    display: 'flex',
    gap: 2,
    marginBottom: 6,
  },
  contactInfo: {
    background: '#F8FAFC',
    padding: 12,
    borderRadius: 6,
    border: '1px solid #E8EEF8',
  },
  recommendationBox: {
    background: '#FEE2E2',
    padding: 12,
    borderRadius: 6,
    border: '1px solid #FCA5A5',
    marginBottom: 16,
  },
  recommendationTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#DC2626',
    marginBottom: 6,
  },
  recommendationText: {
    margin: '0 0 10px 0',
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 1.5,
  },
  reassignBtn: {
    width: '100%',
    padding: '8px 12px',
    background: '#DC2626',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  activityList: {
    background: '#F8FAFC',
    borderRadius: 6,
  },
  activityItem: {
    display: 'flex',
    gap: 8,
    padding: 10,
    borderBottom: '1px solid #E8EEF8',
    fontSize: 12,
  },
  activityTime: {
    color: '#6B7FA3',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  activityDescription: {
    color: '#3A4E70',
  },
};
