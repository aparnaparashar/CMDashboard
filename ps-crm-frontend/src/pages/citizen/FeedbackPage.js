// ps-crm-frontend/src/pages/citizen/FeedbackPage.js

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLang, tx } from '../../context/LanguageContext';
import API from '../../api';
import HeaderNavbar from '../../components/layout/HeaderNavbar';
import LanguageToggle from '../../components/layout/LanguageToggle';

// ── Platform Ratings  ─────────────────────────────────────────────
function PlatformRatings({ lang }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    API.get('/feedback').then(res => setData(res.data.data?.summary || null)).catch(() => {});
  }, []);
  const avgRating    = data?.avgRating    ? `${data.avgRating} ⭐` : '—';
  const totalReviews = data?.totalRatings ?? '—';
  const satisfaction = data?.totalRatings ? `${Math.round((data.positive / data.totalRatings) * 100)}%` : '—';
  return (
    <div style={{ ...styles.card, marginTop: 16, background: 'linear-gradient(135deg,#0F2557,#1A3A6E)' }}>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
        {tx('Platform Ratings', lang)}
      </div>
      {[
        { label: tx('Average Rating', lang),    value: avgRating,    color: '#F59E0B' },
        { label: tx('Total Reviews', lang),     value: totalReviews, color: '#fff' },
        { label: tx('Satisfaction Rate', lang), value: satisfaction, color: '#4ade80' },
      ].map((s, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{s.label}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</span>
        </div>
      ))}
      {!data && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 4 }}>{lang === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}</div>}
    </div>
  );
}

// ── Sidebar: Why it matters ───────────────────────────────────────────────────
function WhyItMatters({ lang }) {
  return (
    <div style={{ ...styles.card, marginTop: 16 }}>
      <div style={styles.cardTitle}>{tx(' Why Your Feedback Matters', lang)}</div>
      {[
        { icon: '', title: 'Improve Services',   desc: lang === 'hi' ? 'आपकी रेटिंग सुधार की जरूरत वाले क्षेत्रों की पहचान करने में मदद करती है' : 'Your ratings help identify areas needing improvement' },
                { icon: '', title: 'Officer Performance', desc: lang === 'hi' ? 'फ़ीडबैक सीधे अधिकारी प्रदर्शन समीक्षाओं को प्रभावित करता है' : 'Feedback directly impacts officer performance reviews' },
                { icon: '', title: 'Policy Changes',     desc: lang === 'hi' ? 'फ़ीडबैक के रुझान नीति सुधारों को बढ़ावा देते हैं' : 'Trends in feedback drive policy improvements' },
                { icon: '', title: 'Reward Excellence',  desc: lang === 'hi' ? 'उच्च रेटेड अधिकारियों को मान्यता और पुरस्कार मिलते हैं' : 'High-rated officers receive recognition and rewards' },
      ].map((f, i) => (
        <div key={i} style={styles.infoRow}>
          <div style={styles.infoIcon}>{f.icon}</div>
          <div>
            <div style={styles.infoTitle}>{tx(f.title, lang)}</div>
            <div style={styles.infoDesc}>{f.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Sidebar: What happens next ────────────────────────────────────────────────
function WhatHappensNext({ lang }) {
  return (
    <div style={{ ...styles.card, marginTop: 16 }}>
      <div style={styles.cardTitle}>{tx('🔄 What Happens Next?', lang)}</div>
      {[
        lang === 'hi' ? 'फ़ीडबैक सिस्टम में दर्ज किया जाता है'         : 'Feedback is recorded in the system',
        lang === 'hi' ? 'अधिकारी प्रदर्शन स्कोर अपडेट किया जाता है'  : 'Officer performance score is updated',
        lang === 'hi' ? 'विभाग प्रमुख कम रेटिंग की समीक्षा करते हैं' : 'Department head reviews low ratings',
        lang === 'hi' ? '30 दिनों में सुधार लागू किए जाते हैं'        : 'Improvements implemented in 30 days',
      ].map((text, i) => (
        <div key={i} style={styles.stepRow}>
          <div style={styles.stepNum}>{String(i + 1).padStart(2, '0')}</div>
          <div style={{ fontSize: 13, color: '#3A4E70' }}>{text}</div>
        </div>
      ))}
    </div>
  );
}

// ── Resolved complaints picker (shown when no :id in URL) ─────────────────────
function ComplaintPicker({ lang, onSelect }) {
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [manualId,   setManualId]   = useState('');
  const [manualErr,  setManualErr]  = useState('');
  const [searching,  setSearching]  = useState(false);

  useEffect(() => {
    API.get('/complaints/my')
      .then(res => setComplaints((res.data.data || []).filter(c => c.status === 'Resolved')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleManualSearch = async () => {
    const trimmed = manualId.trim().toUpperCase();
    if (!trimmed) { setManualErr(lang === 'hi' ? 'शिकायत ID दर्ज करें' : 'Please enter a Complaint ID'); return; }
    setSearching(true); setManualErr('');
    try {
      const res   = await API.get('/complaints/my');
      const all   = res.data.data || [];
      const found = all.find(c =>
        (c.complaintNumber || '').toUpperCase() === trimmed ||
        c._id.slice(-8).toUpperCase() === trimmed.replace('CMP-', '')
      );
      if (!found)                         { setManualErr(lang === 'hi' ? 'यह शिकायत आपके खाते में नहीं मिली' : 'Complaint not found in your account'); return; }
      if (found.status !== 'Resolved')    { setManualErr(lang === 'hi' ? 'केवल हल हुई शिकायतों पर फ़ीडबैक दे सकते हैं' : 'Feedback can only be given for resolved complaints'); return; }
      onSelect(found._id);
    } catch {
      setManualErr(lang === 'hi' ? 'खोज विफल हुई, पुनः प्रयास करें' : 'Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}> {lang === 'hi' ? 'शिकायत चुनें' : 'Select a Complaint'}</div>
      <p style={{ fontSize: 13, color: '#6B7FA3', marginBottom: 20, lineHeight: 1.6 }}>
        {lang === 'hi'
          ? 'नीचे अपनी हल हुई शिकायत पर क्लिक करें, या Complaint ID दर्ज करें।'
          : 'Click a resolved complaint below, or enter your Complaint ID manually.'}
      </p>

      {/* Manual ID search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: manualErr ? 8 : 20 }}>
        <input
          style={{ ...styles.input, flex: 1 }}
          placeholder={lang === 'hi' ? 'Complaint ID दर्ज करें (जैसे CMP-XXXXXXXX)' : 'Enter Complaint ID (e.g. CMP-XXXXXXXX)'}
          value={manualId}
          onChange={e => { setManualId(e.target.value); setManualErr(''); }}
          onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
        />
        <button style={{ ...styles.btnPrimary, whiteSpace: 'nowrap' }} onClick={handleManualSearch} disabled={searching}>
          {searching ? '...' : (lang === 'hi' ? 'खोजें' : 'Search')}
        </button>
      </div>
      {manualErr && <div style={{ ...styles.error, marginBottom: 16 }}>{manualErr}</div>}

      {/* Resolved list */}
      <div style={{ borderTop: '1px solid #F0F4FB', paddingTop: 16 }}>
        <div style={{ fontSize: 11, color: '#9EB3CC', fontWeight: 700, marginBottom: 12, letterSpacing: 0.5 }}>
          {lang === 'hi' ? 'आपकी हल हुई शिकायतें' : 'YOUR RESOLVED COMPLAINTS'}
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#9EB3CC', fontSize: 13 }}>
            {lang === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}
          </div>
        ) : complaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
            <div style={{ fontSize: 14, color: '#6B7FA3' }}>
              {lang === 'hi' ? 'कोई हल हुई शिकायत नहीं मिली' : 'No resolved complaints found'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {complaints.map((c, i) => (
              <div key={i} onClick={() => onSelect(c._id)}
                style={{ padding: '14px 16px', background: '#F8FAFC', borderRadius: 10, border: '1.5px solid #E8EEF8', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#0F2557'; e.currentTarget.style.background = '#EEF2FF'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8EEF8'; e.currentTarget.style.background = '#F8FAFC'; }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0F2557', marginBottom: 4 }}>
                    {c.title?.slice(0, 55)}{c.title?.length > 55 ? '...' : ''}
                  </div>
                  <div style={{ fontSize: 11, color: '#9EB3CC' }}>
                    {c.complaintNumber || `CMP-${c._id.slice(-8).toUpperCase()}`} · {c.category} · {new Date(c.createdAt).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}
                  </div>
                </div>
                <div style={{ padding: '4px 12px', borderRadius: 20, background: '#DCFCE7', color: '#16A34A', fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 12 }}>
                   {lang === 'hi' ? 'हल हुई' : 'Resolved'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Already submitted screen ──────────────────────────────────────────────────
function AlreadySubmitted({ existing, lang, onEdit, navigate }) {
  const emojis = ['', '😠', '😞', '😐', '😊', '🤩'];
  const labels = ['', tx('Very Poor', lang), tx('Poor', lang), tx('Average', lang), tx('Good', lang), tx('Excellent', lang)];
  const colors = ['', '#DC2626', '#D97706', '#2563EB', '#16A34A', '#0F2557'];

  return (
    <div style={styles.card}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✔</div>
        <h3 style={{ fontFamily: "'Noto Serif',serif", fontSize: 20, fontWeight: 700, color: '#0F2557', marginBottom: 8 }}>
          {lang === 'hi' ? 'फ़ीडबैक पहले ही दिया जा चुका है' : 'Feedback Already Submitted'}
        </h3>
        <p style={{ fontSize: 13, color: '#6B7FA3', lineHeight: 1.6 }}>
          {lang === 'hi' ? 'आपने इस शिकायत पर पहले ही अपना फ़ीडबैक दे दिया है।' : 'You have already submitted feedback for this complaint.'}
        </p>
      </div>

      {/* Show what was submitted */}
      <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#9EB3CC', fontWeight: 700, marginBottom: 12, letterSpacing: 0.5 }}>
          {lang === 'hi' ? 'आपका पिछला फ़ीडबैक' : 'YOUR PREVIOUS FEEDBACK'}
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          {[1,2,3,4,5].map(s => (
            <span key={s} style={{ fontSize: 24, color: s <= existing.rating ? '#F59E0B' : '#E5E7EB' }}>★</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: existing.comment ? 12 : 0 }}>
          <span style={{ fontSize: 24 }}>{emojis[existing.rating]}</span>
          <span style={{ fontWeight: 700, color: colors[existing.rating], fontSize: 14 }}>{labels[existing.rating]}</span>
        </div>
        {existing.comment && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#fff', borderRadius: 8, border: '1px solid #E8EEF8' }}>
            <div style={{ fontSize: 11, color: '#9EB3CC', marginBottom: 4, fontWeight: 600 }}>{lang === 'hi' ? 'टिप्पणी' : 'COMMENT'}</div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{existing.comment}</div>
          </div>
        )}
        {existing.aspects?.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {existing.aspects.map((a, i) => (
              <span key={i} style={{ padding: '4px 12px', borderRadius: 99, background: 'rgba(15,37,87,0.08)', color: '#0F2557', fontSize: 12, fontWeight: 600 }}>{a}</span>
            ))}
          </div>
        )}
        <div style={{ marginTop: 12, fontSize: 11, color: '#9EB3CC' }}>
          {lang === 'hi' ? 'जमा किया: ' : 'Submitted: '}
          {existing.createdAt ? new Date(existing.createdAt).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button style={{ ...styles.btnPrimary, flex: 1 }} onClick={onEdit}>
           {lang === 'hi' ? 'फ़ीडबैक संपादित करें' : 'Edit Feedback'}
        </button>
        <button style={{ ...styles.btnOutline, flex: 1 }} onClick={() => navigate('/citizen/dashboard')}>
           {lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
        </button>
      </div>
    </div>
  );
}

// ── Main FeedbackPage ─────────────────────────────────────────────────────────
export default function FeedbackPage() {
  const navigate = useNavigate();
  const { id }   = useParams();       // present only when routed from complaint row
  const { lang } = useLang();

  const [activeId,          setActiveId]          = useState(id || null);
  const [existingFeedback,  setExistingFeedback]  = useState(null);
  const [isEditing,         setIsEditing]         = useState(false);
  const [checkingFeedback,  setCheckingFeedback]  = useState(false);

  const [rating,    setRating]    = useState(0);
  const [hover,     setHover]     = useState(0);
  const [comment,   setComment]   = useState('');
  const [aspects,   setAspects]   = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const aspectOptions = lang === 'hi'
    ? [' त्वरित समाधान', ' अच्छा संवाद', ' सटीक समाधान', ' व्यावसायिक अधिकारी', ' आसान प्रक्रिया', ' समय पर अपडेट']
    : [' Quick Resolution', ' Good Communication', ' Accurate Solution', ' Professional Officer', ' Easy Process', ' Timely Updates'];

  const toggleAspect = (a) => setAspects(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const labels = ['', tx('Very Poor', lang), tx('Poor', lang), tx('Average', lang), tx('Good', lang), tx('Excellent', lang)];
  const colors = ['', '#DC2626', '#D97706', '#2563EB', '#16A34A', '#0F2557'];
  const emojis = ['', '😠', '😞', '😐', '😊', '🤩'];

  // When activeId is set (either from URL or from picker), check for existing feedback
  useEffect(() => {
    if (!activeId) return;
    setCheckingFeedback(true);
    setExistingFeedback(null);
    setIsEditing(false);
    API.get(`/feedback/complaint/${activeId}`)
      .then(res => {
        const fb = res.data.data;
        if (fb) {
          setExistingFeedback(fb);
          // Pre-fill for edit mode
          setRating(fb.rating   || 0);
          setComment(fb.comment || '');
          setAspects(fb.aspects || []);
        }
      })
      .catch(() => {}) // 404 = no feedback yet, that's fine
      .finally(() => setCheckingFeedback(false));
  }, [activeId]);

  const handleSubmit = async () => {
    if (!rating) { setError(tx('Please select a rating', lang)); return; }
    setLoading(true); setError('');
    try {
      if (isEditing && existingFeedback?._id) {
        await API.put(`/feedback/${existingFeedback._id}`, { rating, comment, aspects });
      } else {
        await API.post('/feedback', { complaintId: activeId, rating, comment, aspects });
      }
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || (lang === 'hi' ? 'फ़ीडबैक जमा नहीं हो सका' : 'Failed to submit feedback'));
    }
    setLoading(false);
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={styles.page}>
      <HeaderNavbar activeTab="" />
        <div style={styles.centerWrap}>
          <div style={styles.successCard}>
            <div style={{ fontSize: 72, marginBottom: 16 }}></div>
            <h2 style={styles.successTitle}>{tx('Thank You for Your Feedback!', lang)}</h2>
            <p style={styles.successSub}>{tx('Your feedback helps us improve public services for everyone.', lang)}</p>
            <div style={styles.ratingDisplay}>
              <div style={{ fontSize: 48 }}>{emojis[rating]}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: colors[rating], marginTop: 8 }}>{labels[rating]}</div>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8 }}>
                {[1,2,3,4,5].map(s => (
                  <span key={s} style={{ fontSize: 28, color: s <= rating ? '#F59E0B' : '#E5E7EB' }}>★</span>
                ))}
              </div>
            </div>
            {comment && (
              <div style={styles.commentDisplay}>
                <div style={{ fontSize: 12, color: '#6B7FA3', marginBottom: 6, fontWeight: 600 }}>{lang === 'hi' ? 'आपकी टिप्पणी' : 'YOUR COMMENT'}</div>
                <div style={{ fontSize: 14, color: '#3A4E70', lineHeight: 1.6 }}>{comment}</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 }}>
              <button style={styles.btnPrimary} onClick={() => navigate('/citizen/dashboard')}> {tx('My Dashboard', lang)}</button>
              <button style={styles.btnOutline} onClick={() => navigate('/citizen/submit')}> {tx('New Complaint', lang)}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <HeaderNavbar activeTab="" />
      <div style={styles.container}>
        <div style={styles.pageHead}>
          <h1 style={styles.pageTitle}> {tx('Rate Your Experience', lang)}</h1>
          <p style={styles.pageSub}>
            {activeId
              ? `${tx('Help us improve by sharing your feedback', lang)} — #${activeId.slice(-8).toUpperCase()}`
              : (lang === 'hi' ? 'फ़ीडबैक देने के लिए अपनी हल हुई शिकायत चुनें' : 'Select your resolved complaint to leave feedback')}
          </p>
        </div>

        {/* ── No ID: show picker ── */}
        {!activeId && (
          <div style={styles.grid}>
            <ComplaintPicker lang={lang} onSelect={cid => setActiveId(cid)} />
            <div><PlatformRatings lang={lang} /><WhyItMatters lang={lang} /></div>
          </div>
        )}

        {/* ── Checking existing feedback ── */}
        {activeId && checkingFeedback && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9EB3CC', fontSize: 14 }}>
            {lang === 'hi' ? 'जाँच हो रही है...' : 'Checking existing feedback...'}
          </div>
        )}

        {/* ── Already submitted, not editing ── */}
        {activeId && !checkingFeedback && existingFeedback && !isEditing && (
          <div style={styles.grid}>
            <AlreadySubmitted existing={existingFeedback} lang={lang} onEdit={() => setIsEditing(true)} navigate={navigate} />
            <div><PlatformRatings lang={lang} /><WhyItMatters lang={lang} /></div>
          </div>
        )}

        {/* ── Feedback form (new or editing) ── */}
        {activeId && !checkingFeedback && (!existingFeedback || isEditing) && (
          <div style={styles.grid}>
            <div>
              {/* Edit mode banner */}
              {isEditing && (
                <div style={{ background: '#FFF7ED', border: '1.5px solid #FCD34D', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#92400E', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span> {lang === 'hi' ? 'आप अपना पिछला फ़ीडबैक संपादित कर रहे हैं' : 'Editing your previous feedback'}</span>
                  <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400E', fontSize: 18, lineHeight: 1, padding: 0 }}>✕</button>
                </div>
              )}

              {error && <div style={styles.error}>{error}</div>}

              {/* Stars */}
              <div style={styles.card}>
                <div style={styles.cardTitle}> {tx('Overall Rating', lang)}</div>
                <div style={styles.starsRow}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s}
                      style={{ fontSize: 52, cursor: 'pointer', color: s <= (hover || rating) ? '#F59E0B' : '#E5E7EB', transition: 'all 0.15s' }}
                      onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => setRating(s)}>★</span>
                  ))}
                </div>
                {(hover || rating) > 0 && (
                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <span style={{ fontSize: 36 }}>{emojis[hover || rating]}</span>
                    <div style={{ fontSize: 18, fontWeight: 700, color: colors[hover || rating], marginTop: 4 }}>{labels[hover || rating]}</div>
                  </div>
                )}
              </div>

              {/* Aspects */}
              <div style={{ ...styles.card, marginTop: 16 }}>
                <div style={styles.cardTitle}> {tx('What went well? (Optional)', lang)}</div>
                <div style={styles.aspectsGrid}>
                  {aspectOptions.map((a, i) => (
                    <div key={i} onClick={() => toggleAspect(a)}
                      style={{ ...styles.aspectChip, ...(aspects.includes(a) ? styles.aspectChipActive : {}) }}>{a}</div>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div style={{ ...styles.card, marginTop: 16 }}>
                <div style={styles.cardTitle}> {tx('Additional Comments (Optional)', lang)}</div>
                <textarea
                  style={{ ...styles.input, height: 120, resize: 'vertical' }}
                  placeholder={tx('Share your experience in detail...', lang)}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  maxLength={500}
                />
                <div style={{ fontSize: 12, color: '#9EB3CC', marginTop: 6, textAlign: 'right' }}>
                  {comment.length}/500 {lang === 'hi' ? 'अक्षर' : 'characters'}
                </div>
              </div>

              <button
                style={{ ...styles.btnPrimary, width: '100%', padding: 14, fontSize: 16, marginTop: 16, opacity: loading ? 0.7 : 1 }}
                onClick={handleSubmit} disabled={loading}>
                {loading
                  ? (lang === 'hi' ? '⏳ जमा हो रहा है...' : '⏳ Submitting...')
                  : isEditing
                    ? (lang === 'hi' ? ' फ़ीडबैक अपडेट करें' : ' Update Feedback')
                    : (lang === 'hi' ? ' फ़ीडबैक जमा करें' : ' Submit Feedback')}
              </button>
            </div>

            {/* Right sidebar */}
            <div>
              <PlatformRatings lang={lang} />
              <WhyItMatters lang={lang} />
              <WhatHappensNext lang={lang} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ navigate, lang }) {
  return (
    <>
      <div style={{ background: '#0F2557', height: 34, display: 'flex', alignItems: 'center', padding: '0 40px', borderBottom: '3px solid #E8620A' }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>
          {tx('Government of Delhi · Ministry of Personnel, Public Grievances & Pensions', lang)}
        </span>
      </div>
      <header style={{ background: '#fff', borderBottom: '1px solid #D8E2F0', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', boxShadow: '0 2px 12px rgba(15,37,87,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: 40, height: 40, borderRadius: 9, background: 'linear-gradient(135deg,#0F2557,#1565C0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏛️</div>
          <div>
            <div style={{ fontFamily: "'Noto Serif',serif", fontSize: 16, fontWeight: 700, color: '#0F2557' }}>{tx('PS-CRM Gov Portal', lang)}</div>
            <div style={{ fontSize: 11, color: '#6B7FA3' }}>{tx('Smart Public Service CRM', lang)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          <button style={{ padding: '7px 16px', borderRadius: 8, border: '1.5px solid #0F2557', color: '#0F2557', background: 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            onClick={() => navigate(-1)}>← {tx('Back', lang)}</button>
          <LanguageToggle style={{ border: '1.5px solid #0F2557', background: 'rgba(15,37,87,0.08)', color: '#0F2557' }} />
          <button style={{ padding: '7px 16px', borderRadius: 8, border: '1.5px solid #0F2557', color: '#0F2557', background: 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            onClick={() => navigate('/citizen/dashboard')}> {tx('Home', lang)}</button>
        </div>
      </header>
    </>
  );
}

const styles = {
  page:             { fontFamily: "'DM Sans',sans-serif", background: '#F4F6FB', minHeight: '100vh' },
  container:        { maxWidth: 1100, margin: '0 auto', padding: '40px' },
  pageHead:         { marginBottom: 28 },
  pageTitle:        { fontFamily: "'Noto Serif',serif", fontSize: 26, fontWeight: 700, color: '#0F2557', marginBottom: 6 },
  pageSub:          { color: '#6B7FA3', fontSize: 14 },
  grid:             { display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: 24 },
  card:             { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 12px rgba(15,37,87,0.06)' },
  cardTitle:        { fontWeight: 700, fontSize: 15, color: '#0F2557', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #F0F4FB' },
  starsRow:         { display: 'flex', justifyContent: 'center', gap: 8, padding: '16px 0' },
  aspectsGrid:      { display: 'flex', flexWrap: 'wrap', gap: 10 },
  aspectChip:       { padding: '8px 16px', borderRadius: 100, border: '1.5px solid #D8E2F0', background: '#F8FAFC', color: '#6B7FA3', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  aspectChipActive: { background: 'rgba(15,37,87,0.08)', border: '1.5px solid #0F2557', color: '#0F2557' },
  input:            { width: '100%', padding: '11px 14px', border: '1.5px solid #D8E2F0', borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: 'none', boxSizing: 'border-box' },
  btnPrimary:       { padding: '10px 24px', background: '#E8620A', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
  btnOutline:       { padding: '10px 24px', background: 'transparent', color: '#0F2557', border: '1.5px solid #0F2557', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
  error:            { background: '#FEE2E2', color: '#C62828', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 },
  infoRow:          { display: 'flex', gap: 14, marginBottom: 16 },
  infoIcon:         { fontSize: 24, flexShrink: 0 },
  infoTitle:        { fontWeight: 700, fontSize: 13, color: '#0F2557', marginBottom: 3 },
  infoDesc:         { fontSize: 12, color: '#6B7FA3', lineHeight: 1.5 },
  stepRow:          { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 },
  stepNum:          { width: 26, height: 26, borderRadius: '50%', background: '#0F2557', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 },
  centerWrap:       { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 100px)', padding: 40 },
  successCard:      { background: '#fff', borderRadius: 16, padding: 48, maxWidth: 500, width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(15,37,87,0.12)' },
  successTitle:     { fontFamily: "'Noto Serif',serif", fontSize: 24, fontWeight: 700, color: '#0F2557', marginBottom: 10 },
  successSub:       { color: '#6B7FA3', fontSize: 14, marginBottom: 24 },
  ratingDisplay:    { background: '#F8FAFC', borderRadius: 12, padding: 24, marginBottom: 16 },
  commentDisplay:   { background: '#F8FAFC', borderRadius: 10, padding: 16, textAlign: 'left', marginTop: 16 },
};