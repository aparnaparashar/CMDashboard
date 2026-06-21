import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang, tx } from '../../context/LanguageContext';
import API from '../../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';
import HeaderNavbar from '../../components/layout/HeaderNavbar';
import NearbyComplaints from './NearbyComplaints';
import VisitLogs from './VisitLogs';
import CMMobileView from './CMMobileView';
import OfficerBandwidthPanel from './OfficerBandwidthPanel';

const COLORS = ['#0F2557', '#E8620A', '#1B7A3E', '#1565C0', '#8B5CF6'];

// ── Feedback Section ─────────────────────────────────────────────────────────
function FeedbackSection({ complaintId }) {
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    API.get(`/feedback/${complaintId}`)
      .then(res => setFeedback(res.data.data?.[0] || null))
      .catch(() => {});
  }, [complaintId]);

  if (!feedback) return (
    <div style={{ marginTop: 12, padding: '12px 16px', background: '#FFFBEB', borderRadius: 8, border: '1px solid #FCD34D' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#D97706', marginBottom: 4 }}>CITIZEN FEEDBACK</div>
      <div style={{ fontSize: 13, color: '#9EB3CC' }}>No feedback submitted yet</div>
    </div>
  );

  return (
    <div style={{ marginTop: 12, padding: '12px 16px', background: '#FFFBEB', borderRadius: 8, border: '1px solid #FCD34D' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#D97706', marginBottom: 8 }}>CITIZEN FEEDBACK</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {[1,2,3,4,5].map(s => (
          <span key={s} style={{ fontSize: 20, color: s <= feedback.rating ? '#F59E0B' : '#E5E7EB' }}>★</span>
        ))}
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F2557' }}>{feedback.rating}/5</span>
        <span style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 12, fontWeight: 700,
          background: feedback.sentiment === 'Positive' ? '#DCFCE7' : feedback.sentiment === 'Negative' ? '#FEE2E2' : '#EEF2FF',
          color:      feedback.sentiment === 'Positive' ? '#16A34A' : feedback.sentiment === 'Negative' ? '#DC2626' : '#2563EB',
        }}>
          {feedback.sentiment}
        </span>
      </div>
      {feedback.aspects?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
          {feedback.aspects.map((a, i) => (
            <span key={i} style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: '#EEF2FF', color: '#0F2557', fontWeight: 600 }}>{a}</span>
          ))}
        </div>
      )}
      {feedback.comment && (
        <div style={{ fontSize: 13, color: '#3A4E70', fontStyle: 'italic' }}>"{feedback.comment}"</div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { lang } = useLang();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cmLocation, setCmLocation] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // overview, cm-mobile, officer-panel

  // ── Track modal ──
  const [trackModal, setTrackModal] = useState(null);
  const [trackData, setTrackData]   = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    API.get('/dashboard')
      .then(res => { setStats(res.data.data); setLoading(false); })
      .catch(() => setLoading(false));

    // Get CM location for nearby complaints
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async position => {
          const nextLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            placeName: 'Current location',
            ward: '',
          };

          try {
            const params = new URLSearchParams({
              lat: String(nextLocation.latitude),
              lng: String(nextLocation.longitude),
            });
            const res = await API.get(`/location/reverse?${params.toString()}`);
            nextLocation.placeName = res.data.data?.placeName || nextLocation.placeName;
            nextLocation.ward = res.data.data?.ward || '';
          } catch (error) {
            console.warn('Reverse location lookup failed:', error.message);
          }

          setCmLocation(nextLocation);
        },
        () => console.log('Geolocation not available')
      );
    }
  }, []);

  const openTrack = async (c) => {
    setTrackModal(c);
    setTrackData(null);
    setTrackLoading(true);
    try {
      const res = await API.get(`/complaints/${c._id}`);
      setTrackData(res.data.data);
    } catch { setTrackData(c); }
    setTrackLoading(false);
  };

  const imgSrc = (img) => {
    if (!img) return '';
    if (typeof img === 'string') return img;
    return img.data || '';
  };

  const statusSteps = [
    { key: 'Pending',     label: 'Submitted',   icon: '1' },
    { key: 'In Progress', label: 'In Progress', icon: '2' },
    { key: 'Resolved',    label: 'Resolved',    icon: '3' },
    { key: 'Escalated',   label: 'Escalated',   icon: '4' },
  ];

  const stepIndex = (status) => {
    if (status === 'Escalated') return 3;
    return ['Pending', 'In Progress', 'Resolved'].indexOf(status);
  };

  const d = trackData || trackModal;
  const beforeImgs  = d?.images      || [];
  const afterImgs   = d?.afterImages || [];
  const currentStep = d ? stepIndex(d.status) : 0;

  return (
    <div style={styles.layout}>
      <HeaderNavbar activeTab="dashboard" />

      <div style={styles.main}>
        {/* Topbar */}
        <div style={styles.topbar}>
          <div>
            <h1 style={styles.pageTitle}>{tx('Dashboard Overview', lang)} (CM + Team)</h1>
            <p style={styles.pageSub}>
              {new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={styles.viewModeButtons}>
              <button
                onClick={() => setViewMode('overview')}
                style={{
                  ...styles.viewModeBtn,
                  background: viewMode === 'overview' ? '#0F2557' : '#E8EEF8',
                  color: viewMode === 'overview' ? '#fff' : '#0F2557',
                }}
              >
                Overview
              </button>
              <button
                onClick={() => setViewMode('cm-mobile')}
                style={{
                  ...styles.viewModeBtn,
                  background: viewMode === 'cm-mobile' ? '#0F2557' : '#E8EEF8',
                  color: viewMode === 'cm-mobile' ? '#fff' : '#0F2557',
                }}
              >
                CM View
              </button>
              <button
                onClick={() => setViewMode('officer-panel')}
                style={{
                  ...styles.viewModeBtn,
                  background: viewMode === 'officer-panel' ? '#0F2557' : '#E8EEF8',
                  color: viewMode === 'officer-panel' ? '#fff' : '#0F2557',
                }}
              >
                Officers
              </button>
            </div>
            <button style={styles.btnRefresh} onClick={() => window.location.reload()}>
              {tx(' Refresh', lang)}
            </button>
            <div style={styles.adminChip}>
              <div style={styles.chipAvatar}>{user?.name?.charAt(0)}</div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#6B7FA3', fontSize: 16 }}>
             {tx('Loading...', lang)}
          </div>
        ) : stats ? (
          <>
            {/* VIEW MODE: OVERVIEW (Default) */}
            {viewMode === 'overview' && (
              <>
                {/* Nearby Complaints Section */}
                {cmLocation && (
                  <NearbyComplaints cmLocation={cmLocation} />
                )}

                {/* Overview Cards */}
                <div style={{ ...styles.cards, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  {[
                    { label: 'Total Complaints', value: stats.overview.total,      color: '#0F2557', icon: '◉' },
                    { label: 'Pending',          value: stats.overview.pending,     color: '#0F2557', icon: '◐' },
                    { label: 'In Progress',      value: stats.overview.inProgress,  color: '#0F2557', icon: '⟳' },
                    { label: 'Resolved',         value: stats.overview.resolved,    color: '#0F2557', icon: '✓' },
                    { label: 'Escalated',        value: stats.overview.escalated,   color: '#0F2557', icon: '▲' },
                  ].map((item, i) => (
                    <div key={i} style={styles.card}>
                      <div style={{ ...styles.cardIcon, background: item.color + '15', color: item.color }}>
                        {item.icon}
                      </div>
                      <div style={styles.cardValue}>{item.value ?? 0}</div>
                      <div style={styles.cardLabel}>{item.label}</div>
                      <div style={{ ...styles.cardBar, background: item.color }}></div>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                <div style={styles.chartsRow}>
                  {stats.complaintsByCategory && (
                    <div style={styles.chartCard}>
                      <div style={styles.chartTitle}>Complaints by Category</div>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={stats.complaintsByCategory}>
                          <XAxis dataKey="category" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#0F2557" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {stats.statusDistribution && (
                    <div style={styles.chartCard}>
                      <div style={styles.chartTitle}>Status Distribution</div>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={stats.statusDistribution} cx="50%" cy="50%" labelLine={false} label innerRadius={50} outerRadius={80} dataKey="value">
                            {stats.statusDistribution.map((item, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Visit Logs Section */}
                <VisitLogs cmId={user?._id} />

                {/* Recent Complaints Table */}
                {stats.recentComplaints && stats.recentComplaints.length > 0 && (
                  <div style={styles.tableCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F2557' }}>Recent Complaints</h3>
                      <button style={styles.viewAllBtn}>{tx('View All', lang)}</button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['ID', 'Type', 'Citizen', 'Status', 'Assigned To', 'Actions'].map(h => (
                            <th key={h} style={styles.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentComplaints.map((c, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #E8EEF8' }}>
                            <td style={styles.td}>{c._id?.slice(-6)}</td>
                            <td style={styles.td}>{c.complaintType}</td>
                            <td style={styles.td}>{c.citizen?.name}</td>
                            <td style={styles.td}>
                              <span style={{
                                padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                                background: c.status === 'Resolved' ? '#DCFCE7' : c.status === 'Escalated' ? '#FEE2E2' : c.status === 'In Progress' ? '#FEF3C7' : '#EEF2FF',
                                color:      c.status === 'Resolved' ? '#16A34A' : c.status === 'Escalated' ? '#DC2626' : c.status === 'In Progress' ? '#F59E0B' : '#0F2557',
                              }}>
                                {c.status}
                              </span>
                            </td>
                            <td style={styles.td}>{c.assignedTo?.name || 'Unassigned'}</td>
                            <td style={styles.td}>
                              <button style={styles.btnTrack} onClick={() => openTrack(c)}>Track</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* VIEW MODE: CM MOBILE */}
            {viewMode === 'cm-mobile' && (
              <CMMobileView cmId={user?._id} cmName={user?.name} />
            )}

            {/* VIEW MODE: OFFICER BANDWIDTH PANEL */}
            {viewMode === 'officer-panel' && (
              <OfficerBandwidthPanel />
            )}
          </>
        ) : null}

        {/* Track Modal */}
        {trackModal && (
          <div style={modal.overlay} onClick={() => { setTrackModal(null); setLightbox(null); }}>
            <div style={modal.box} onClick={e => e.stopPropagation()}>
              <div style={modal.header}>
                <div>
                  <h3 style={modal.title}>Complaint Details</h3>
                  <div style={modal.sub}>ID: {trackModal._id}</div>
                </div>
                <button style={modal.closeBtn} onClick={() => { setTrackModal(null); setLightbox(null); }}>×</button>
              </div>

              <div style={modal.body}>
                {trackLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6B7FA3' }}>Loading...</div>
                ) : (
                  <>
                    {/* Timeline */}
                    <div style={modal.section}>
                      <div style={modal.sectionTitle}>PROGRESS TIMELINE</div>
                      <div style={modal.timeline}>
                        {statusSteps.map((step, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: i <= currentStep ? '#0F2557' : '#E8EEF8', color: i <= currentStep ? '#fff' : '#9EB3CC',
                              fontWeight: 700, fontSize: 12,
                            }}>
                              {i + 1}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: i <= currentStep ? '#0F2557' : '#9EB3CC', marginLeft: 12, marginRight: 12 }}>
                              {step.label}
                            </div>
                            {i < statusSteps.length - 1 && (
                              <div style={{
                                height: 2, flex: 1, background: i < currentStep ? '#0F2557' : '#E8EEF8',
                              }}></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div style={modal.section}>
                      <div style={modal.sectionTitle}>COMPLAINT INFORMATION</div>
                      <div style={modal.grid}>
                        {[
                          { label: 'Type',         value: d?.complaintType },
                          { label: 'Category',     value: d?.category },
                          { label: 'Assigned To',  value: d?.assignedTo?.name || 'Unassigned' },
                          { label: 'Citizen Name', value: d?.citizen?.name },
                          { label: 'Phone',        value: d?.citizen?.phone || 'N/A' },
                          { label: 'SLA Deadline', value: d?.sla?.deadline ? new Date(d.sla.deadline).toLocaleDateString('en-IN') : 'N/A' },
                          { label: 'Status',       value: d?.status },
                        ].map((item, i) => (
                          <div key={i} style={modal.gridItem}>
                            <div style={modal.gridLabel}>{item.label}</div>
                            <div style={modal.gridValue}>{item.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Description */}
                      {d?.description && (
                        <div style={{ marginTop: 12, padding: '12px 16px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E8EEF8' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7FA3', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>DESCRIPTION</div>
                          <div style={{ fontSize: 13, color: '#3A4E70', lineHeight: 1.6 }}>{d.description}</div>
                        </div>
                      )}

                      {/* Resolution Note */}
                      {d?.resolution && (
                        <div style={{ marginTop: 12, padding: '12px 16px', background: '#F0FDF4', borderRadius: 8, borderLeft: '3px solid #16A34A' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', marginBottom: 4 }}>RESOLUTION NOTE</div>
                          <div style={{ fontSize: 13, color: '#1A3A2A' }}>{d.resolution}</div>
                        </div>
                      )}

                      {/* Citizen Feedback */}
                      {d?.status === 'Resolved' && d?._id && (
                        <FeedbackSection complaintId={d._id} />
                      )}
                    </div>

                    {/* Before & After Photos */}
                    <div style={modal.section}>
                      <div style={modal.sectionTitle}>BEFORE & AFTER PHOTOS</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                        <div>
                          <div style={modal.photoHeader}>
                            <span style={{ ...modal.photoBadge, background: '#FEE2E2', color: '#DC2626' }}>BEFORE</span>
                            <span style={modal.photoCount}>{beforeImgs.length} photo(s) · by citizen</span>
                          </div>
                          {beforeImgs.length === 0 ? (
                            <div style={modal.emptyPhotos}>No photos uploaded by citizen</div>
                          ) : (
                            <div style={modal.photoGrid}>
                              {beforeImgs.map((img, i) => (
                                <img key={i} src={imgSrc(img)} alt={`before-${i}`}
                                  style={modal.photoThumb}
                                  onClick={() => setLightbox(imgSrc(img))}
                                  onError={e => e.target.style.display = 'none'} />
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <div style={modal.photoHeader}>
                            <span style={{ ...modal.photoBadge, background: '#DCFCE7', color: '#16A34A' }}>AFTER</span>
                            <span style={modal.photoCount}>{afterImgs.length} photo(s) · by officer</span>
                          </div>
                          {afterImgs.length === 0 ? (
                            <div style={modal.emptyPhotos}>
                              {d?.status === 'Resolved' ? 'Officer did not upload after photos' : 'Complaint not yet resolved'}
                            </div>
                          ) : (
                            <div style={modal.photoGrid}>
                              {afterImgs.map((img, i) => (
                                <img key={i} src={imgSrc(img)} alt={`after-${i}`}
                                  style={modal.photoThumb}
                                  onClick={() => setLightbox(imgSrc(img))}
                                  onError={e => e.target.style.display = 'none'} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightbox && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setLightbox(null)}>
            <img src={lightbox} alt="full" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }} />
            <button style={{ position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 22, width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}
              onClick={() => setLightbox(null)}>×</button>
          </div>
        )}
      </div>
    </div>
  );
}

const modal = {
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(15,37,87,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  box:          { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 780, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(15,37,87,0.25)' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 28px 16px', borderBottom: '1px solid #E8EEF8', position: 'sticky', top: 0, background: '#fff', zIndex: 10 },
  title:        { fontFamily: "'Noto Serif',serif", fontSize: 20, fontWeight: 700, color: '#0F2557', margin: 0 },
  sub:          { fontSize: 13, color: '#6B7FA3', marginTop: 4 },
  closeBtn:     { width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #E8EEF8', background: '#F8FAFC', color: '#6B7FA3', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  body:         { padding: '20px 28px 28px' },
  section:      { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#6B7FA3', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  timeline:     { display: 'flex', alignItems: 'center' },
  grid:         { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  gridItem:     { background: '#F8FAFC', borderRadius: 8, padding: '10px 14px' },
  gridLabel:    { fontSize: 11, color: '#9EB3CC', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  gridValue:    { fontSize: 13, fontWeight: 600, color: '#0F2557' },
  photoHeader:  { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  photoBadge:   { fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
  photoCount:   { fontSize: 11, color: '#9EB3CC' },
  photoGrid:    { display: 'flex', flexWrap: 'wrap', gap: 8 },
  photoThumb:   { width: 90, height: 90, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: '2px solid #E8EEF8' },
  emptyPhotos:  { background: '#F8FAFC', borderRadius: 8, padding: '20px', textAlign: 'center', color: '#9EB3CC', fontSize: 13 },
};

const styles = {
  layout:      { background: '#F4F6FB', minHeight: '100vh', fontFamily: "'DM Sans',sans-serif" },
  main:        { maxWidth: 1240, margin: '0 auto', padding: '40px 40px 60px', background: '#F4F6FB', minHeight: 'calc(100vh - 150px)', boxSizing: 'border-box' },
  topbar:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid #E8EEF8', flexWrap: 'wrap', gap: 12 },
  pageTitle:   { fontFamily: "'Noto Serif',serif", fontSize: 24, fontWeight: 700, color: '#0F2557' },
  pageSub:     { color: '#6B7FA3', fontSize: 13, marginTop: 4 },
  viewModeButtons: { display: 'flex', gap: 8 },
  viewModeBtn: { padding: '8px 14px', border: '1.5px solid #D8E2F0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s ease' },
  btnRefresh:  { padding: '8px 16px', border: '1.5px solid #D8E2F0', borderRadius: 8, background: '#fff', color: '#0F2557', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  adminChip:   { display: 'flex', alignItems: 'center', gap: 8, background: '#fff', padding: '6px 14px', borderRadius: 20, boxShadow: '0 2px 8px rgba(15,37,87,0.08)' },
  chipAvatar:  { width: 28, height: 28, borderRadius: '50%', background: '#0F2557', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 },
  cards:       { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 24 },
  card:        { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(15,37,87,0.06)', minHeight: 170, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' },
  cardIcon:    { width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, marginBottom: 12 },
  cardValue:   { fontSize: 32, fontWeight: 700, marginBottom: 4 },
  cardLabel:   { fontSize: 13, color: '#6B7FA3', marginBottom: 12 },
  cardBar:     { height: 6, borderRadius: 4, overflow: 'hidden', marginTop: 'auto' },
  chartsRow:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 },
  chartCard:   { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(15,37,87,0.06)' },
  chartTitle:  { fontSize: 15, fontWeight: 700, color: '#0F2557', marginBottom: 16 },
  tableCard:   { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(15,37,87,0.06)' },
  th:          { padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6B7FA3', textTransform: 'uppercase', letterSpacing: 0.5 },
  td:          { padding: '12px 16px', fontSize: 14, color: '#3A4E70' },
  viewAllBtn:  { padding: '6px 14px', border: '1.5px solid #D8E2F0', borderRadius: 8, background: 'transparent', color: '#0F2557', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnTrack:    { padding: '6px 14px', border: '1.5px solid #0F2557', borderRadius: 6, background: '#EEF2FF', color: '#0F2557', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
};
