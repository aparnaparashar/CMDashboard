import { useState, useEffect, useCallback } from 'react';
import API from '../../api';

export default function NearbyComplaints({ cmLocation }) {
  const [nearbyComplaints, setNearbyComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [radius, setRadius] = useState(5);
  const [lookupNote, setLookupNote] = useState('');

  const fetchNearbyComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        lat: String(cmLocation.latitude),
        lng: String(cmLocation.longitude),
        radius: String(radius),
      });
      if (cmLocation.ward) params.set('ward', cmLocation.ward);

      const res = await API.get(`/complaints/nearby?${params.toString()}`);
      setNearbyComplaints(res.data.data || []);
      const meta = res.data.meta;
      setLookupNote(meta?.ward && meta.wardMatches > 0 ? `Includes ${meta.wardMatches} ward match${meta.wardMatches === 1 ? '' : 'es'} from ${meta.ward}` : '');
    } catch (err) {
      console.error('Error fetching nearby complaints:', err);
      setLookupNote('Could not load nearby complaints');
    }
    setLoading(false);
  }, [cmLocation, radius]);

  useEffect(() => {
    if (cmLocation?.latitude && cmLocation?.longitude) {
      fetchNearbyComplaints();
    }
  }, [cmLocation, fetchNearbyComplaints]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(2);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return '#DC2626';
      case 'In Progress': return '#F59E0B';
      case 'Resolved': return '#16A34A';
      case 'Escalated': return '#8B5CF6';
      default: return '#6B7FA3';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Nearby Complaints</h3>
          <div style={styles.locationInfo}>
            <span style={styles.locationLabel}>Current Location:</span>
            <span style={styles.placeName}>
              {cmLocation?.placeName || 'Detecting place name...'}
            </span>
          </div>
          {cmLocation?.ward && (
            <div style={styles.wardInfo}>Ward: {cmLocation.ward}</div>
          )}
        </div>
        <div style={styles.radiusControl}>
          <label style={styles.radiusLabel}>Search Radius:</label>
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            style={styles.radiusSelect}
          >
            <option value={1}>1 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
          </select>
          <span style={styles.count}>{nearbyComplaints.length} found</span>
        </div>
      </div>
      {lookupNote && <div style={styles.lookupNote}>{lookupNote}</div>}

      {loading ? (
        <div style={styles.loadingText}>Loading nearby complaints...</div>
      ) : nearbyComplaints.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>MAP</div>
          <p>No complaints found nearby</p>
        </div>
      ) : (
        <div style={styles.complaintsList}>
          {nearbyComplaints.map((complaint) => {
            const distance = complaint.distanceKm ?? (
              complaint.location?.latitude && complaint.location?.longitude
                ? calculateDistance(
                    cmLocation.latitude, cmLocation.longitude,
                    complaint.location.latitude, complaint.location.longitude
                  )
                : null
            );
            const locationText = [
              complaint.location?.line1,
              complaint.location?.locality,
              complaint.location?.ward,
            ].filter(Boolean).join(', ');
            
            return (
              <div 
                key={complaint._id} 
                style={{
                  ...styles.complaintCard,
                  borderLeft: `4px solid ${getStatusColor(complaint.status)}`
                }}
                onClick={() => setSelectedComplaint(complaint)}
              >
                <div style={styles.complaintHeader}>
                  <div>
                    <div style={styles.complaintId}>ID: {complaint._id?.slice(-6)}</div>
                    <div style={styles.complaintType}>{complaint.complaintType}</div>
                  </div>
                  <div style={{
                    ...styles.statusBadge,
                    background: getStatusColor(complaint.status) + '20',
                    color: getStatusColor(complaint.status)
                  }}>
                    {complaint.status}
                  </div>
                </div>
                <div style={styles.complaintDetails}>
                  <span style={styles.detailItem}>
                    <strong style={styles.detailLabel}>Distance:</strong> {distance != null ? `${distance}km away` : 'Same ward'}
                  </span>
                  {locationText && (
                    <span style={styles.detailItem}>
                      <strong style={styles.detailLabel}>Location:</strong> {locationText}
                    </span>
                  )}
                  <span style={styles.detailItem}>
                    <strong style={styles.detailLabel}>Citizen:</strong> {complaint.citizen?.name || 'Unknown'}
                  </span>
                  <span style={styles.detailItem}>
                    <strong style={styles.detailLabel}>Phone:</strong> {complaint.citizen?.phone || 'N/A'}
                  </span>
                </div>
                <div style={styles.complaintDescription}>
                  {complaint.description?.substring(0, 100)}...
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedComplaint && (
        <div style={styles.modalOverlay} onClick={() => setSelectedComplaint(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h4 style={styles.modalTitle}>Complaint Details</h4>
              <button style={styles.closeBtn} onClick={() => setSelectedComplaint(null)}>×</button>
            </div>
            <div style={styles.modalBody}>
              <p><strong>ID:</strong> {selectedComplaint._id}</p>
              <p><strong>Type:</strong> {selectedComplaint.complaintType}</p>
              <p><strong>Status:</strong> {selectedComplaint.status}</p>
              <p><strong>Citizen:</strong> {selectedComplaint.citizen?.name}</p>
              <p><strong>Phone:</strong> {selectedComplaint.citizen?.phone}</p>
              <p><strong>Location:</strong> {[selectedComplaint.location?.line1, selectedComplaint.location?.locality, selectedComplaint.location?.ward].filter(Boolean).join(', ') || 'N/A'}</p>
              <p><strong>Description:</strong> {selectedComplaint.description}</p>
              <p><strong>Submitted:</strong> {new Date(selectedComplaint.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
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
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid #E8EEF8',
    gap: 16,
    flexWrap: 'wrap',
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#0F2557',
  },
  locationInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    fontSize: 13,
  },
  locationLabel: {
    fontWeight: 600,
    color: '#0F2557',
  },
  placeName: {
    background: '#F0F4FF',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    color: '#0F2557',
    fontWeight: 600,
  },
  wardInfo: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7FA3',
    fontWeight: 600,
  },
  lookupNote: {
    marginBottom: 14,
    fontSize: 12,
    color: '#6B7FA3',
    fontWeight: 600,
  },
  radiusControl: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  radiusLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#0F2557',
  },
  radiusSelect: {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #D8E2F0',
    fontSize: 12,
    fontWeight: 500,
    color: '#0F2557',
    background: '#fff',
    cursor: 'pointer',
  },
  count: {
    fontSize: 12,
    background: '#EEF2FF',
    color: '#0F2557',
    padding: '4px 12px',
    borderRadius: 12,
    fontWeight: 600,
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
  emptyIcon: {
    fontSize: 48,
    fontWeight: 700,
    color: '#D8E2F0',
    marginBottom: 12,
    letterSpacing: 2,
  },
  complaintsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 16,
  },
  complaintCard: {
    background: '#F8FAFC',
    borderRadius: 8,
    padding: 14,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ':hover': {
      boxShadow: '0 4px 12px rgba(15,37,87,0.1)',
    },
  },
  complaintHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  complaintId: {
    fontSize: 12,
    color: '#6B7FA3',
    fontWeight: 600,
  },
  complaintType: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0F2557',
    marginTop: 4,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 12,
  },
  complaintDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 10,
    fontSize: 12,
  },
  detailItem: {
    color: '#3A4E70',
    fontWeight: 500,
  },
  detailLabel: {
    color: '#0F2557',
    fontWeight: 700,
  },
  complaintDescription: {
    fontSize: 12,
    color: '#6B7FA3',
    lineHeight: 1.4,
    fontStyle: 'italic',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,37,87,0.45)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    background: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    boxShadow: '0 24px 80px rgba(15,37,87,0.25)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #E8EEF8',
  },
  modalTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#0F2557',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: 'none',
    background: '#F8FAFC',
    color: '#6B7FA3',
    cursor: 'pointer',
    fontSize: 18,
    fontWeight: 700,
  },
  modalBody: {
    padding: '16px 20px',
    maxHeight: 'calc(90vh - 100px)',
    overflowY: 'auto',
  },
};
