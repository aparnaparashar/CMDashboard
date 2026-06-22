import { useState, useEffect, useCallback, useRef } from 'react';
import API from '../../api';

// ── Reverse-geocode via OpenStreetMap Nominatim (free, no key) ───────────────
async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': 'GovGrievanceApp/1.0' } }
  );
  if (!res.ok) throw new Error('Nominatim request failed');
  const data = await res.json();
  if (data.error) throw new Error(data.error);

  const addr = data.address || {};
  const ward =
    addr.quarter || addr.suburb || addr.neighbourhood ||
    addr.city_district || addr.county || addr.state_district ||
    addr.city || addr.town || addr.village || 'Unknown Ward';
  const locality = addr.city || addr.town || addr.village || addr.state_district || '';
  const placeName = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  return { ward, locality, placeName };
}

// ── Haversine distance in km ─────────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Status colours ───────────────────────────────────────────────────────────
const STATUS_COLORS = {
  Pending:       { bg: '#FEE2E2', text: '#DC2626', border: '#DC2626' },
  'In Progress': { bg: '#FEF3C7', text: '#D97706', border: '#F59E0B' },
  Resolved:      { bg: '#DCFCE7', text: '#16A34A', border: '#16A34A' },
  Escalated:     { bg: '#EDE9FE', text: '#7C3AED', border: '#8B5CF6' },
};
const defColor    = { bg: '#F1F5F9', text: '#475569', border: '#94A3B8' };
const statusColor = (s) => STATUS_COLORS[s] || defColor;

const RADIUS_OPTIONS = [1, 5, 10, 25];

// ── Component ────────────────────────────────────────────────────────────────
export default function NearbyComplaints() {
  const [gps,           setGps]           = useState(null);
  const [geoInfo,       setGeoInfo]       = useState(null);
  const [allComplaints, setAllComplaints] = useState([]);
  const [nearby,        setNearby]        = useState([]);
  const [radius,        setRadius]        = useState(5);
  const [selected,      setSelected]      = useState(null);
  const [phase,         setPhase]         = useState('idle');
  const [errorMsg,      setErrorMsg]      = useState('');
  const abortRef = useRef(null);

  // ── Step 1: fetch ALL complaints once ────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await API.get('/complaints');
        setAllComplaints(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch complaints:', err);
      }
    })();
  }, []);

  // ── Step 2: GPS detect ───────────────────────────────────────────────────
  const detectLocation = useCallback(() => {
    setPhase('locating');
    setErrorMsg('');
    setGeoInfo(null);
    setNearby([]);

    if (!navigator.geolocation) {
      setPhase('error');
      setErrorMsg('Geolocation is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => { setPhase('error'); setErrorMsg('Could not detect location: ' + err.message); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => { detectLocation(); }, [detectLocation]);

  // ── Step 3: reverse-geocode once GPS is ready ────────────────────────────
  useEffect(() => {
    if (!gps) return;
    setPhase('geocoding');
    reverseGeocode(gps.lat, gps.lng)
      .then((info) => { setGeoInfo(info); setPhase('done'); })
      .catch((err) => { setPhase('error'); setErrorMsg('Could not identify ward: ' + err.message); });
  }, [gps]);

  // ── Step 4: filter complaints by radius + ward whenever inputs change ─────
  useEffect(() => {
    if (!gps || !allComplaints.length) return;

    const results = allComplaints
      .map((c) => {
        const cLat = c.location?.latitude  ?? c.location?.coordinates?.[1] ?? null;
        const cLng = c.location?.longitude ?? c.location?.coordinates?.[0] ?? null;

        // If complaint has coordinates, use haversine
        if (cLat != null && cLng != null) {
          const dist = haversine(gps.lat, gps.lng, cLat, cLng);
          return dist <= radius ? { ...c, _dist: dist } : null;
        }

        // Fallback: ward name match (case-insensitive partial)
        if (geoInfo?.ward && c.location?.ward) {
          const cWard    = c.location.ward.toLowerCase();
          const myWard   = geoInfo.ward.toLowerCase();
          const myLocality = geoInfo.locality?.toLowerCase() || '';
          const matched  =
            cWard.includes(myWard) || myWard.includes(cWard) ||
            (myLocality && cWard.includes(myLocality));
          return matched ? { ...c, _dist: null } : null;
        }

        return null;
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a._dist == null && b._dist == null) return 0;
        if (a._dist == null) return 1;
        if (b._dist == null) return -1;
        return a._dist - b._dist;
      });

    setNearby(results);
  }, [gps, geoInfo, allComplaints, radius]);

  const isLoading = ['locating', 'geocoding'].includes(phase);
  const loadingLabel = {
    locating:  'Detecting your GPS location...',
    geocoding: 'Identifying your ward from coordinates...',
  }[phase] || '';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={s.container}>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h3 style={s.title}>Nearby Complaints</h3>

          <div style={s.locationRow}>
            <span style={s.locationLabel}>Current Location:</span>
            <span style={{ ...s.placePill, color: geoInfo ? '#0F2557' : '#94A3B8' }}>
              {geoInfo ? geoInfo.placeName : phase === 'locating' ? 'Detecting...' : 'Unknown'}
            </span>
          </div>

          {geoInfo?.ward && (
            <div style={s.wardPill}>
              Ward: <strong>{geoInfo.ward}</strong>
            </div>
          )}
        </div>

        <div style={s.headerRight}>
          <div style={s.radiusGroup}>
            <label style={s.radiusLabel}>Radius:</label>
            <select
              style={s.radiusSelect}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
            >
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>{r} km</option>
              ))}
            </select>
          </div>

          {phase === 'done' && (
            <span style={s.countBadge}>{nearby.length} found</span>
          )}

          <button
            style={{ ...s.refreshBtn, opacity: isLoading ? 0.6 : 1 }}
            onClick={detectLocation}
            disabled={isLoading}
          >
            {isLoading ? '...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={s.loadingBox}>
          <div style={s.spinner} />
          <span style={s.loadingText}>{loadingLabel}</span>
        </div>
      )}

      {/* Error */}
      {phase === 'error' && (
        <div style={s.errorBox}>
          <div style={s.errorDot} />
          <div style={s.errorContent}>
            <div style={s.errorTitle}>Something went wrong</div>
            <div style={s.errorMsg}>{errorMsg}</div>
          </div>
          <button style={s.retryBtn} onClick={detectLocation}>Retry</button>
        </div>
      )}

      {/* Empty */}
      {phase === 'done' && nearby.length === 0 && (
        <div style={s.emptyBox}>
          <div style={s.emptyTitle}>No complaints found nearby</div>
          <div style={s.emptyMsg}>
            No complaints registered within <strong>{radius} km</strong> of your location
            {geoInfo?.ward ? ` (${geoInfo.ward})` : ''}.
            Try increasing the search radius.
          </div>
        </div>
      )}

      {/* Complaints Grid */}
      {nearby.length > 0 && (
        <div style={s.grid}>
          {nearby.map((c) => {
            const col      = statusColor(c.status);
            const distText = c._dist != null ? `${c._dist.toFixed(2)} km away` : 'Same ward';
            const locText  = [c.location?.line1, c.location?.locality, c.location?.ward]
              .filter(Boolean).join(', ');

            return (
              <div
                key={c._id}
                style={{ ...s.card, borderLeft: `4px solid ${col.border}` }}
                onClick={() => setSelected(c)}
              >
                <div style={s.cardTop}>
                  <div>
                    <div style={s.cardId}>#{c._id?.slice(-6).toUpperCase()}</div>
                    <div style={s.cardType}>{c.complaintType || c.title || 'Complaint'}</div>
                  </div>
                  <span style={{ ...s.badge, background: col.bg, color: col.text }}>
                    {c.status}
                  </span>
                </div>

                <div style={s.meta}>
                  <div style={s.distRow}>
                    <span style={{
                      ...s.distBadge,
                      background: c._dist != null ? '#EEF2FF' : '#F0FDF4',
                      color:      c._dist != null ? '#3B5BA5' : '#16A34A',
                    }}>
                      {distText}
                    </span>
                    {c.urgency && (
                      <span style={{
                        ...s.urgBadge,
                        background: c.urgency === 'High' ? '#FEE2E2' : c.urgency === 'Medium' ? '#FEF3C7' : '#DCFCE7',
                        color:      c.urgency === 'High' ? '#DC2626' : c.urgency === 'Medium' ? '#D97706' : '#16A34A',
                      }}>
                        {c.urgency}
                      </span>
                    )}
                  </div>
                  {locText && <span style={s.metaItem}>{locText}</span>}
                  {c.category && <span style={s.metaItem}>{c.category}</span>}
                  <span style={s.metaItem}>Citizen: {c.citizen?.name || 'Unknown'}</span>
                  {c.citizen?.phone && <span style={s.metaItem}>Phone: {c.citizen.phone}</span>}
                  {c.createdAt && (
                    <span style={s.metaItem}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                  )}
                </div>

                {(c.description || c.title) && (
                  <div style={s.desc}>
                    {(c.description || c.title).length > 110
                      ? (c.description || c.title).substring(0, 110) + '...'
                      : (c.description || c.title)}
                  </div>
                )}

                <div style={s.viewMore}>View details</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div style={s.overlay} onClick={() => setSelected(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHead}>
              <div>
                <div style={s.modalId}>#{selected._id?.slice(-6).toUpperCase()}</div>
                <h4 style={s.modalTitle}>{selected.complaintType || selected.title}</h4>
              </div>
              <div style={s.modalHeadRight}>
                <span style={{
                  ...s.badge,
                  background: statusColor(selected.status).bg,
                  color:      statusColor(selected.status).text,
                }}>
                  {selected.status}
                </span>
                <button style={s.closeBtn} onClick={() => setSelected(null)}>x</button>
              </div>
            </div>

            <div style={s.modalBody}>
              {[
                ['Full ID',   selected._id],
                ['Category',  selected.category || '--'],
                ['Urgency',   selected.urgency  || '--'],
                ['Citizen',   selected.citizen?.name  || '--'],
                ['Phone',     selected.citizen?.phone || '--'],
                ['Email',     selected.citizen?.email || '--'],
                ['Location',  [selected.location?.line1, selected.location?.locality, selected.location?.ward].filter(Boolean).join(', ') || '--'],
                ['Ward',      selected.location?.ward || geoInfo?.ward || '--'],
                ['Distance',  selected._dist != null ? `${selected._dist.toFixed(2)} km` : 'Same ward'],
                ['Submitted', selected.createdAt ? new Date(selected.createdAt).toLocaleString('en-IN') : '--'],
              ].map(([label, val]) => (
                <div key={label} style={s.modalRow}>
                  <span style={s.modalLabel}>{label}</span>
                  <span style={s.modalVal}>{val}</span>
                </div>
              ))}

              <div style={s.modalDescLabel}>Description</div>
              <div style={s.modalDesc}>{selected.description || 'No description provided.'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = {
  container: {
    background: '#fff',
    borderRadius: 14,
    padding: 24,
    boxShadow: '0 2px 12px rgba(15,37,87,0.08)',
    marginBottom: 24,
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: '1px solid #E8EEF8',
    gap: 16,
    flexWrap: 'wrap',
  },
  title: {
    margin: 0,
    fontSize: 17,
    fontWeight: 700,
    color: '#0F2557',
    letterSpacing: '-0.3px',
  },
  locationRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    fontSize: 13,
  },
  locationLabel: {
    fontWeight: 600,
    color: '#0F2557',
    whiteSpace: 'nowrap',
  },
  placePill: {
    background: '#EEF2FF',
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    maxWidth: 380,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  wardPill: {
    marginTop: 8,
    fontSize: 12,
    color: '#3B5BA5',
    background: '#EEF2FF',
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 20,
    fontWeight: 500,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  radiusGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  radiusLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#0F2557',
    whiteSpace: 'nowrap',
  },
  radiusSelect: {
    padding: '6px 10px',
    borderRadius: 8,
    border: '1.5px solid #D8E2F0',
    fontSize: 12,
    fontWeight: 500,
    color: '#0F2557',
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
  },
  countBadge: {
    fontSize: 12,
    background: '#0F2557',
    color: '#fff',
    padding: '5px 14px',
    borderRadius: 20,
    fontWeight: 700,
  },
  refreshBtn: {
    padding: '7px 16px',
    borderRadius: 8,
    border: '1.5px solid #D8E2F0',
    background: '#fff',
    color: '#0F2557',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  loadingBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '20px 0',
  },
  spinner: {
    width: 20,
    height: 20,
    border: '2.5px solid #E8EEF8',
    borderTop: '2.5px solid #0F2557',
    borderRadius: '50%',
    animation: 'nc-spin 0.8s linear infinite',
    flexShrink: 0,
  },
  loadingText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: 500,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 10,
    padding: '14px 16px',
    marginTop: 4,
  },
  errorDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#DC2626',
    flexShrink: 0,
  },
  errorContent: { flex: 1 },
  errorTitle:   { fontWeight: 700, color: '#991B1B', fontSize: 13 },
  errorMsg:     { color: '#B91C1C', fontSize: 12, marginTop: 2 },
  retryBtn: {
    padding: '6px 14px',
    borderRadius: 8,
    border: 'none',
    background: '#DC2626',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  emptyBox: {
    textAlign: 'center',
    padding: '48px 20px',
  },
  emptyTitle: { fontSize: 15, fontWeight: 700, color: '#475569', marginBottom: 6 },
  emptyMsg:   { fontSize: 13, color: '#94A3B8', lineHeight: 1.6 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
    gap: 14,
    marginTop: 4,
  },
  card: {
    background: '#F8FAFC',
    borderRadius: 10,
    padding: 16,
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardId:   { fontSize: 11, color: '#94A3B8', fontWeight: 700, letterSpacing: 1 },
  cardType: { fontSize: 14, fontWeight: 700, color: '#0F2557', marginTop: 3 },
  badge: {
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 20,
    whiteSpace: 'nowrap',
  },
  distRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  distBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 20,
  },
  urgBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 20,
  },
  meta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginBottom: 10,
  },
  metaItem: { fontSize: 12, color: '#475569', fontWeight: 500 },
  desc: {
    fontSize: 12,
    color: '#6B7FA3',
    lineHeight: 1.5,
    fontStyle: 'italic',
    borderTop: '1px solid #E8EEF8',
    paddingTop: 10,
    marginTop: 4,
  },
  viewMore: {
    fontSize: 11,
    color: '#3B5BA5',
    fontWeight: 700,
    marginTop: 8,
    textAlign: 'right',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,37,87,0.5)',
    zIndex: 3000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    background: '#fff',
    borderRadius: 14,
    width: '100%',
    maxWidth: 520,
    boxShadow: '0 24px 80px rgba(15,37,87,0.3)',
    overflow: 'hidden',
  },
  modalHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '18px 20px',
    borderBottom: '1px solid #E8EEF8',
    background: '#F8FAFC',
  },
  modalId:    { fontSize: 11, color: '#94A3B8', fontWeight: 700, letterSpacing: 1 },
  modalTitle: { margin: '4px 0 0', fontSize: 16, fontWeight: 700, color: '#0F2557' },
  modalHeadRight: { display: 'flex', alignItems: 'center', gap: 10 },
  closeBtn: {
    width: 30, height: 30,
    borderRadius: '50%',
    border: 'none',
    background: '#E8EEF8',
    color: '#0F2557',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  modalBody: {
    padding: '16px 20px',
    maxHeight: 'calc(90vh - 120px)',
    overflowY: 'auto',
  },
  modalRow: {
    display: 'flex',
    gap: 12,
    padding: '9px 0',
    borderBottom: '1px solid #F1F5F9',
    fontSize: 13,
    alignItems: 'flex-start',
  },
  modalLabel: { minWidth: 90, fontWeight: 700, color: '#0F2557', flexShrink: 0 },
  modalVal:   { color: '#334155', wordBreak: 'break-word' },
  modalDescLabel: {
    fontWeight: 700,
    color: '#0F2557',
    fontSize: 13,
    marginTop: 14,
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 1.7,
    background: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
  },
};

if (typeof document !== 'undefined' && !document.getElementById('nc-spin-style')) {
  const st = document.createElement('style');
  st.id = 'nc-spin-style';
  st.textContent = `@keyframes nc-spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(st);
}