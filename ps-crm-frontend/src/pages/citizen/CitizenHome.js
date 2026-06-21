import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang, tx } from '../../context/LanguageContext';
import API from '../../api';
import HeaderNavbar from '../../components/layout/HeaderNavbar';

// ── Animated Counter Hook ─────────────────────────────────────────────────────
function useAnimatedCounter(target, duration = 1800) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  const startAnimation = useCallback(() => {
    if (started.current || target <= 0) return;
    started.current = true;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) startAnimation(); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startAnimation]);

  return [value, ref];
}

// ── Counter Card ──────────────────────────────────────────────────────────────
function CounterCard({ icon, label, target, suffix = '', color, percent }) {
  const [val, ref] = useAnimatedCounter(target);
  return (
    <div ref={ref} style={s.counterCard}>
      <div style={{ ...s.counterIcon, background: 'transparent', color: '#ffffff' }}>{icon}</div>
      <div style={{ ...s.counterValue, color: '#ffffff' }}>{val.toLocaleString('en-IN')}{suffix}</div>
      <div style={s.counterLabel}>{label}</div>
      {percent !== undefined && (
        <div style={s.progressWrap}>
          <div style={{ ...s.progressBar, width: `${Math.min(percent, 100)}%`, background: '#ffffff' }} />
        </div>
      )}
    </div>
  );
}

// ── News Ticker ───────────────────────────────────────────────────────────────
function NewsTicker({ items }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % items.length), 4500);
    return () => clearInterval(t);
  }, [items.length]);
  return (
    <div style={s.tickerBar}>
      <div style={s.tickerLabel}>
        <span style={s.tickerLabelNew}>NEW</span>
        <span style={s.tickerLabelText}>Latest News</span>
      </div>
      <div style={s.tickerContent} key={idx}>
        <span style={s.tickerText}>{items[idx]}</span>
      </div>
      <div style={s.tickerNav}>
        <button style={s.tickerBtn} onClick={() => setIdx(i => (i - 1 + items.length) % items.length)}>‹</button>
        <button style={s.tickerBtn} onClick={() => setIdx(i => (i + 1) % items.length)}>›</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CITIZEN HOME - Unified Government Portal Design (No Emojis, Clean Layout)
// ═══════════════════════════════════════════════════════════════════════════════
export default function CitizenHome() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { lang } = useLang();
  const T = (key) => tx(key, lang);

  const [stats, setStats] = useState(null);
  const [initiativeIdx, setInitiativeIdx] = useState(0);

  useEffect(() => {
    API.get('/dashboard/public')
      .then(res => { if (res.data.success) setStats(res.data.data); })
      .catch(() => {});
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'Citizen';
  const resolutionRate = stats ? Math.round((stats.resolved / (stats.total || 1)) * 100) : 0;

  // ── Quick Actions SVGs ────────────────────────────────────────────────────
  const quickActions = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      ),
      title: T('Register Complaint'),
      desc: T('File a new grievance with photos & location'),
      path: '/citizen/submit',
      color: '#FF9933',
      public: false
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      ),
      title: T('Track Complaint'),
      desc: T('Check real-time status and SLA countdown'),
      path: '/citizen/track',
      color: '#0F2557',
      public: true
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      ),
      title: T('Notifications'),
      desc: T('View updates on your complaint progress'),
      path: '/notifications',
      color: '#138808',
      public: false
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      ),
      title: T('Public Dashboard'),
      desc: T('Live transparency data and ward analytics'),
      path: '/public',
      color: '#FF9933',
      public: true
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
      title: T('AI Assistant'),
      desc: T('Get instant help with complaint filing'),
      path: '/citizen/submit',
      color: '#0F2557',
      public: false
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      title: T('My Profile'),
      desc: T('Manage your account and preferences'),
      path: '/citizen/profile',
      color: '#138808',
      public: false
    },
  ];

  // ── Government Initiatives ────────────────────────────────────────────────
  const initiatives = [
    { title: 'Swachh Delhi', desc: lang === 'hi' ? 'स्वच्छ दिल्ली अभियान - हर गली, हर मोहल्ला साफ़' : 'Clean Delhi mission - every lane, every neighbourhood', color: '#FF9933' },
    { title: 'Smart City Delhi', desc: lang === 'hi' ? 'स्मार्ट शहरी अवसंरचना और डिजिटल सेवाएं' : 'Smart urban infrastructure and digital governance', color: '#0F2557' },
    { title: lang === 'hi' ? 'महिला सुरक्षा' : 'Women Safety', desc: lang === 'hi' ? 'सुरक्षित दिल्ली - हेल्पलाइन, सीसीटीवी, पेट्रोलिंग' : 'Safe Delhi - helplines, CCTV, patrolling', color: '#138808' },
    { title: lang === 'hi' ? 'जल प्रबंधन' : 'Water Management', desc: lang === 'hi' ? 'पानी की गुणवत्ता, आपूर्ति और जल संरक्षण' : 'Water quality monitoring, supply & conservation', color: '#FF9933' },
    { title: lang === 'hi' ? 'सार्वजनिक स्वास्थ्य' : 'Public Health', desc: lang === 'hi' ? 'मोहल्ला क्लिनिक, टीकाकरण और स्वास्थ्य सेवाएं' : 'Mohalla clinics, vaccination & health services', color: '#0F2557' },
  ];

  // ── News items ────────────────────────────────────────────────────────────
  const newsItems = lang === 'hi' ? [
    'दिल्ली जल बोर्ड: 16 जून को ज़ोन-3 में नियोजित रखरखाव - पानी की आपूर्ति प्रभावित हो सकती है',
    'नई योजना: मुख्यमंत्री आवास योजना - पात्र नागरिक ऑनलाइन आवेदन करें',
    'भीषण गर्मी चेतावनी: दोपहर 12–4 बजे बाहर निकलने से बचें। हेल्पलाइन: 1800-111-555',
    'PS-CRM अपडेट: अब डिजिटल लोक शिकायत सेवा सीधे उपयोग के लिए उपलब्ध है',
  ] : [
    'Delhi Jal Board: Scheduled maintenance in Zone-3 on June 16 - water supply may be affected',
    'New Scheme: Chief Minister Housing Scheme - eligible citizens can apply online now',
    'Extreme Heat Advisory: Avoid outdoor exposure 12 PM–4 PM. Helpline: 1800-111-555',
    'PS-CRM Update: Digital public grievance services are now fully operational online',
  ];

  return (
    <div style={s.page}>
      {/* ── CSS Animations ── */}
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn  { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pulse    { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes tickerFade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes floatSlow { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
        .gov-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .gov-card:hover { transform: translateY(-4px); box-shadow: 0 8px 28px rgba(15,37,87,0.12) !important; }
        .init-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .init-card:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.1) !important; }
        .nav-link:hover { background: rgba(255,255,255,0.08) !important; }
        .leader-item { transition: background-color 0.2s ease; }
        .leader-item:hover { background-color: rgba(255,255,255,0.06) !important; }
        .cabinet-card-item { transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; }
        .cabinet-card-item:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(15,37,87,0.1) !important; border-color: #0F2557 !important; }
      `}</style>

      <HeaderNavbar activeTab="home" />

      {/* ═══════════════════════════════════════════════════════════════════════
          NEWS TICKER
      ═══════════════════════════════════════════════════════════════════════ */}
      <NewsTicker items={newsItems} />

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1 - HERO BANNER & Leadership Sidebar
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={s.hero}>
        <div style={s.heroImgWrap}>
          <img src="/delhi-hero.png" alt="Delhi Monuments" style={s.heroImg} />
          <div style={s.heroOverlay} />
        </div>
        <div style={s.heroContent}>
          <div style={{ ...s.heroLeft, animation: 'fadeInUp 0.8s ease-out' }}>
            <div style={s.heroWelcome}>
              {lang === 'hi' ? `नमस्ते ${firstName}, स्वागत है` : `Namaste ${firstName}, Welcome`}
            </div>
            <h1 style={s.heroTitle}>
              {lang === 'hi'
                ? <>दिल्ली <span style={{ color: '#FF9933' }}>नागरिक सेवा</span> पोर्टल</>
                : <>Delhi <span style={{ color: '#FF9933' }}>Citizen Services</span> Portal</>
              }
            </h1>
            <p style={s.heroSub}>
              {lang === 'hi'
                ? 'शिकायतें, पारदर्शिता, जवाबदेही और सार्वजनिक सेवा वितरण के लिए एक मंच।'
                : 'One platform for complaints, transparency, accountability, and public service delivery.'}
            </p>
            <div style={s.heroBtns}>
              <button style={s.heroBtnPrimary} onClick={() => { if (!user) navigate('/login'); else navigate('/citizen/submit'); }}>
                {lang === 'hi' ? 'शिकायत दर्ज करें' : 'File Complaint'}
              </button>
              <button style={s.heroBtnSecondary} onClick={() => navigate('/citizen/track')}>
                {lang === 'hi' ? 'शिकायत ट्रैक करें' : 'Track Complaint'}
              </button>
              <button style={s.heroBtnOutline} onClick={() => navigate('/public')}>
                {lang === 'hi' ? 'सार्वजनिक डैशबोर्ड' : 'View Public Dashboard'}
              </button>
            </div>
          </div>

          {/* Delhi Leadership Sidebar Card - glassmorphism */}
          <div style={{ ...s.leadershipGlassCard, animation: 'fadeInUp 1s ease-out' }}>
            <div style={s.leadershipGlassHeader}>
              <span style={s.leadershipLiveDot} />
              {lang === 'hi' ? 'दिल्ली नेतृत्व' : 'DELHI LEADERSHIP'}
            </div>
            <div style={s.leaderSingleCol}>
              <div style={{ ...s.leaderGlassImgWrap, border: '2.5px solid #138808', margin: '0 auto 12px' }}>
                <img src="/cm-gupta.jpg" alt="Smt. Rekha Gupta" style={s.leaderGlassImg} />
              </div>
              <div style={s.leaderGlassRole}>{lang === 'hi' ? 'माननीय मुख्यमंत्री' : 'Hon’ble Chief Minister'}</div>
              <div style={s.leaderGlassName}>{lang === 'hi' ? 'श्रीमती रेखा गुप्ता' : 'Smt. Rekha Gupta'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1.5 - DELHI CABINET MINISTERS (Below Hero Banner)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={s.cabinetSection}>
        <div style={s.sectionInner}>
          <div style={s.sectionHead}>
            <div style={{ ...s.sectionHeadAccent, background: '#FF9933' }} />
            <h2 style={s.sectionTitle}>
              {lang === 'hi' ? 'दिल्ली कैबिनेट मंत्री' : 'Delhi Cabinet Ministers'}
            </h2>
          </div>
          <div style={s.cabinetGrid}>
            {[
              { name: 'Dr. Pankaj Kumar Singh', title: lang === 'hi' ? 'कैबिनेट मंत्री' : 'Cabinet Minister', govt: lang === 'hi' ? 'भारत सरकार' : 'Govt. of India', img: '/pankaj-singh.jpg' },
              { name: 'Shri Kapil Mishra', title: lang === 'hi' ? 'कैबिनेट मंत्री' : 'Cabinet Minister', govt: lang === 'hi' ? 'भारत सरकार' : 'Govt. of India', img: '/kapil-mishra.jpg' },
              { name: 'Shri Ravinder Indraj Singh', title: lang === 'hi' ? 'कैबिनेट मंत्री' : 'Cabinet Minister', govt: lang === 'hi' ? 'भारत सरकार' : 'Govt. of India', img: '/ravinder-singh.jpg' },
              { name: 'Sardar Manjinder Singh Sirsa', title: lang === 'hi' ? 'कैबिनेट मंत्री' : 'Cabinet Minister', govt: lang === 'hi' ? 'भारत सरकार' : 'Govt. of India', img: '/manjinder-sirsa.jpg' },
              { name: 'Shri Ashish Sood', title: lang === 'hi' ? 'कैबिनेट मंत्री' : 'Cabinet Minister', govt: lang === 'hi' ? 'भारत सरकार' : 'Govt. of India', img: '/ashish-sood.jpg' },
              { name: lang === 'hi' ? 'श्री प्रवेश साहिब सिंह' : 'Shri Parvesh Sahib Singh', title: lang === 'hi' ? 'कैबिनेट मंत्री' : 'Cabinet Minister', govt: lang === 'hi' ? 'भारत सरकार' : 'Govt. of India', img: '/parvesh-singh.jpg' },
            ].map((min, idx) => (
              <div key={idx} className="cabinet-card-item" style={s.cabinetCard}>
                <div style={s.cabinetImgWrap}>
                  <img src={min.img} alt={min.name} style={s.cabinetImg} />
                </div>
                <div style={s.cabinetName}>{min.name}</div>
                <div style={s.cabinetRole}>{min.title}</div>
                <div style={s.cabinetGovt}>{min.govt}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2 - CITIZEN SERVICES (Quick Actions)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={s.sectionWhite}>
        <div style={s.sectionInner}>
          <div style={s.sectionHead}>
            <div style={s.sectionHeadAccent} />
            <h2 style={s.sectionTitle}>{lang === 'hi' ? 'नागरिक सेवाएं' : 'Citizen Services'}</h2>
          </div>
          <p style={s.sectionSub}>
            {lang === 'hi' ? 'एक क्लिक में अपनी सरकारी सेवाओं तक पहुंचें' : 'Access all government services in one click'}
          </p>
          <div style={s.servicesGrid}>
            {quickActions.map((a, i) => {
              const tricolors = ['#FF9933', '#0F2557', '#138808'];
              const boxColor = tricolors[i % 3];
              return (
                <div
                  key={i}
                  className="gov-card"
                  style={{ ...s.serviceCard, borderLeft: `5px solid ${boxColor}` }}
                  onClick={() => {
                    if (!a.public && !user) navigate('/login');
                    else navigate(a.path);
                  }}
                >
                  <div style={{ ...s.serviceIcon, background: boxColor + '12', color: boxColor }}>{a.icon}</div>
                  <div>
                    <div style={s.serviceTitle}>{a.title}</div>
                    <div style={s.serviceDesc}>{a.desc}</div>
                  </div>
                  <div style={{ ...s.serviceArrow, color: boxColor }}>›</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3 - GOVERNANCE TRANSPARENCY (Animated Counters)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={s.sectionDark}>
        <div style={s.sectionInner}>
          <div style={{ ...s.sectionHead, marginBottom: 8 }}>
            <div style={{ ...s.sectionHeadAccent, background: '#FF9933' }} />
            <h2 style={{ ...s.sectionTitle, color: '#fff' }}>
              {lang === 'hi' ? 'शासन पारदर्शिता' : 'Governance Transparency'}
            </h2>
          </div>
          <p style={{ ...s.sectionSub, color: 'rgba(255,255,255,0.5)', marginBottom: 40 }}>
            {lang === 'hi' ? 'वास्तविक समय के आंकड़े - सरकार की जवाबदेली' : 'Real-time metrics - government accountability at your fingertips'}
          </p>
          <div style={s.countersGrid}>
            <CounterCard
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 17 10 11 15 16 22 9"></polyline>
                  <polyline points="18 9 22 9 22 13"></polyline>
                </svg>
              }
              label={lang === 'hi' ? 'शिकायतें प्राप्त' : 'Complaints Received'}
              target={stats?.total || 0}
              color="#FF9933"
              percent={100}
            />
            <CounterCard
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              }
              label={lang === 'hi' ? 'समाधान' : 'Resolved Cases'}
              target={stats?.resolved || 0}
              color="#16A34A"
              percent={resolutionRate}
            />
            <CounterCard
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              }
              label={lang === 'hi' ? 'लंबित' : 'Pending Cases'}
              target={stats?.pending || 0}
              color="#FF9933"
              percent={stats ? (stats.pending / (stats.total || 1)) * 100 : 0}
            />
            <CounterCard
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 10"></polyline>
                </svg>
              }
              label={lang === 'hi' ? 'औसत समाधान समय' : 'Avg Resolution Time'}
              target={stats?.avgResponse || 0}
              suffix="h"
              color="#0F2557"
              percent={stats?.avgResponse ? Math.min((stats.avgResponse / 72) * 100, 100) : 0}
            />
            <CounterCard
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              }
              label={lang === 'hi' ? 'नागरिक संतुष्टि' : 'Citizen Satisfaction'}
              target={resolutionRate}
              suffix="%"
              color="#138808"
              percent={resolutionRate}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 4 - GOVERNMENT INITIATIVES
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={s.sectionWhite}>
        <div style={s.sectionInner}>
          <div style={s.sectionHead}>
            <div style={s.sectionHeadAccent} />
            <h2 style={s.sectionTitle}>{lang === 'hi' ? 'सरकारी पहलें' : 'Government Initiatives'}</h2>
          </div>
          <p style={s.sectionSub}>
            {lang === 'hi' ? 'दिल्ली सरकार की प्रमुख योजनाएं और अभियान' : 'Key Delhi Government programs and campaigns'}
          </p>
          <div style={s.initCarousel}>
            <button
              style={{ ...s.initArrow, left: -16 }}
              onClick={() => setInitiativeIdx(Math.max(0, initiativeIdx - 1))}
              disabled={initiativeIdx === 0}
            >‹</button>
            <div style={s.initTrack}>
              <div style={{ display: 'flex', gap: 20, transform: `translateX(-${initiativeIdx * 260}px)`, transition: 'transform 0.4s ease' }}>
                {initiatives.map((init, i) => (
                  <div key={i} className="init-card" style={{ ...s.initCard, borderTop: `4px solid ${init.color}` }}>
                    <div style={s.initTitle}>{init.title}</div>
                    <div style={s.initDesc}>{init.desc}</div>
                    <div style={{ ...s.initBadge, background: init.color + '12', color: init.color }}>
                      {lang === 'hi' ? 'दिल्ली सरकार' : 'Govt. of Delhi'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              style={{ ...s.initArrow, right: -16 }}
              onClick={() => setInitiativeIdx(Math.min(initiatives.length - 3, initiativeIdx + 1))}
              disabled={initiativeIdx >= initiatives.length - 3}
            >›</button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 5 - PUBLIC NOTICES (Notice Board Style)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={s.sectionLight}>
        <div style={s.sectionInner}>
          <div style={s.sectionHead}>
            <div style={{ ...s.sectionHeadAccent, background: '#DC2626' }} />
            <h2 style={s.sectionTitle}>{lang === 'hi' ? 'सार्वजनिक सूचनाएं' : 'Public Notices & Advisories'}</h2>
          </div>
          <div style={s.noticeBoard}>
            {newsItems.map((item, i) => (
              <div key={i} style={s.noticeItem}>
                <div style={s.noticeDot} />
                <div style={s.noticeText}>{item}</div>
                <div style={s.noticeDate}>
                  {new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 6 - ABOUT PORTAL
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={s.sectionWhite}>
        <div style={s.sectionInner}>
          <div style={s.aboutGrid}>
            <div>
              <div style={s.sectionHead}>
                <div style={s.sectionHeadAccent} />
                <h2 style={s.sectionTitle}>{lang === 'hi' ? 'पोर्टल के बारे में' : 'About This Portal'}</h2>
              </div>
              <p style={s.aboutP}>
                {lang === 'hi'
                  ? 'यह पोर्टल नागरिकों को समस्याओं की रिपोर्ट करने, समाधान की निगरानी करने और पारदर्शी शासन में भाग लेने का अधिकार देता है। AI-संचालित वर्गीकरण, SLA ट्रैकिंग और वास्तविक समय की अधिसूचनाओं के साथ, PS-CRM सार्वजनिक सेवा वितरण को बदल रहा है।'
                  : 'This portal empowers citizens to report issues, monitor resolutions, and participate in transparent governance. With AI-powered classification, SLA tracking, and real-time notifications, PS-CRM is transforming public service delivery across Delhi.'}
              </p>
              <div style={s.aboutFeatures}>
                {[
                  lang === 'hi' ? 'AI-संचालित शिकायत वर्गीकरण' : 'AI-Powered Complaint Classification',
                  lang === 'hi' ? 'SLA-बाउंड रिज़ॉल्यूशन ट्रैकिंग' : 'SLA-Bound Resolution Tracking',
                  lang === 'hi' ? 'तत्काल ईमेल और SMS अधिसूचनाएं' : 'Instant Email & SMS Notifications',
                  lang === 'hi' ? 'सार्वजनिक पारदर्शिता डैशबोर्ड' : 'Public Transparency Dashboard',
                  lang === 'hi' ? 'शिकायत हीटमैप विश्लेषण' : 'Complaint Heatmap Analytics',
                ].map((f, i) => (
                  <div key={i} style={s.aboutFeatureRow}>
                    <div style={s.aboutFeatureDot} />
                    <span style={s.aboutFeatureText}>{f}</span>
                  </div>
                ))}
              </div>
              <button style={s.aboutBtn} onClick={() => {
                if (!user) navigate('/login');
                else if (user.role === 'admin') navigate('/admin/dashboard');
                else if (user.role === 'officer') navigate('/officer/dashboard');
                else navigate('/citizen/dashboard');
              }}>
                {lang === 'hi' ? 'मेरा डैशबोर्ड खोलें' : 'Go to My Dashboard'}
              </button>
            </div>
            <div style={s.aboutImgWrap}>
              <img src="/delhi-hero.png" alt="Delhi Monuments" style={s.aboutImg} />
              <div style={s.aboutImgLabel}>
            {lang === 'hi' ? 'दिल्ली - भारत की राजधानी' : 'Delhi - Capital of India'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 7 - GOVERNMENT FOOTER
      ═══════════════════════════════════════════════════════════════════════ */}
      <footer style={s.footer}>
        <div style={s.footerTriColor}>
          <div style={{ flex: 1, height: 4, background: '#FF9933' }} />
          <div style={{ flex: 1, height: 4, background: '#FFF' }} />
          <div style={{ flex: 1, height: 4, background: '#138808' }} />
        </div>

        <div style={s.footerInner}>
          <div style={s.footerGrid}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <img src="/ashoka-emblem.png" alt="Emblem" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} />
                <div>
                  <div style={s.footerBrand}>PS-CRM <span style={{ color: '#FF9933' }}>Gov Portal</span></div>
                  <div style={s.footerBrandSub}>{lang === 'hi' ? 'स्मार्ट सार्वजनिक सेवा CRM' : 'Smart Public Service CRM'}</div>
                </div>
              </div>
              <p style={s.footerDesc}>
                {lang === 'hi' ? 'प्रौद्योगिकी के माध्यम से नागरिकों और दिल्ली सरकार के बीच विश्वास बनाना।' : 'Building trust between citizens and Government of Delhi through technology.'}
              </p>
            </div>

            <div>
              <div style={s.footerHeading}>{lang === 'hi' ? 'त्वरित लिंक' : 'Quick Links'}</div>
              {[
                { l: lang === 'hi' ? 'शिकायत दर्ज करें' : 'File Complaint',    p: '/citizen/submit' },
                { l: lang === 'hi' ? 'शिकायत ट्रैक करें' : 'Track Status',      p: '/citizen/track' },
                { l: lang === 'hi' ? 'मेरा डैशबोर्ड' : 'My Dashboard',      p: '/citizen/dashboard' },
                { l: lang === 'hi' ? 'सार्वजनिक डैशबोर्ड' : 'Public Dashboard',  p: '/public' },
                { l: lang === 'hi' ? 'सूचनाएं' : 'Notifications',     p: '/notifications' },
              ].map(item => (
                <div key={item.p} style={s.footerLink} onClick={() => {
                  if (item.p === '/citizen/submit' || item.p === '/citizen/dashboard' || item.p === '/notifications') {
                    if (!user) navigate('/login');
                    else navigate(item.p);
                  } else {
                    navigate(item.p);
                  }
                }}>{item.l}</div>
              ))}
            </div>

            <div>
              <div style={s.footerHeading}>{lang === 'hi' ? 'कानूनी' : 'Legal & Compliance'}</div>
              {[
                'RTI - Right to Information',
                'Citizen Charter',
                'Accessibility Statement',
                'Data Privacy Policy',
                'Terms of Service',
              ].map((item, i) => (
                <div key={i} style={s.footerLink}>{item}</div>
              ))}
            </div>

            <div>
              <div style={s.footerHeading}>{lang === 'hi' ? 'संपर्क करें' : 'Contact Us'}</div>
              <div style={s.footerContact}>Email: grievance@pscrm.gov.in</div>
              <div style={s.footerContact}>Toll Free: 1800-111-555 ({lang === 'hi' ? 'निःशुल्क' : 'Toll Free'})</div>
              <div style={s.footerContact}>Address: {lang === 'hi' ? 'दिल्ली सचिवालय, आई.पी. एस्टेट' : 'Delhi Secretariat, I.P. Estate'}</div>
              <div style={{ marginTop: 16 }}>
                <div style={s.footerHeading}>{lang === 'hi' ? 'सरकारी निकाय' : 'Government Bodies'}</div>
                <div style={s.footerContact}>{lang === 'hi' ? 'राष्ट्रीय सूचना विज्ञान केंद्र (NIC)' : 'National Informatics Centre (NIC)'}</div>
                <div style={s.footerContact}>{lang === 'hi' ? 'कार्मल मंत्रालय' : 'Ministry of Personnel & PG'}</div>
              </div>
            </div>
          </div>

          <div style={s.footerBottom}>
            <div>{lang === 'hi' ? '© 2026 दिल्ली राष्ट्रीय राजधानी क्षेत्र सरकार - स्मार्ट सार्वजनिक सेवा CRM। सर्वाधिकार सुरक्षित।' : '© 2026 Government of NCT of Delhi - Smart Public Service CRM. All rights reserved.'}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
              {lang === 'hi' ? 'राष्ट्रीय सूचना विज्ञान केंद्र (NIC) द्वारा डिज़ाइन एवं विकसित' : 'Designed & Developed by National Informatics Centre (NIC)'}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const s = {
  page: { fontFamily: "'DM Sans', sans-serif", background: '#FAFBFE', minHeight: '100vh' },

  // ── Top Bar ──
  topBar:      { background: '#1A237E', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', borderBottom: '2px solid #FF9933' },
  topBarLeft:  { display: 'flex', alignItems: 'center', gap: 12 },
  triColor:    { display: 'flex', flexDirection: 'column', gap: 0 },
  topBarText:  { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 500, letterSpacing: 0.3 },
  topBarRight: { display: 'flex', alignItems: 'center', gap: 12 },
  topBarLink:  { fontSize: 11, color: 'rgba(255,255,255,0.55)', cursor: 'pointer' },
  topBarDivider: { color: 'rgba(255,255,255,0.2)', fontSize: 14 },

  // ── Header ──
  header:       { background: '#fff', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E8ECF0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  headerLeft:   { display: 'flex', alignItems: 'center', gap: 16 },
  emblemImg:    { width: 52, height: 62, objectFit: 'contain' },
  headerTitle:  { fontFamily: "'Noto Serif', serif", fontSize: 22, fontWeight: 700, color: '#1A237E', lineHeight: 1.2 },
  headerSubtitle: { fontSize: 12, color: '#6B7FA3', marginTop: 3, fontWeight: 500 },
  headerRight:  { display: 'flex', alignItems: 'center', gap: 20 },
  flagWrap:     { display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 3, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  userChip:     { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px 6px 6px', borderRadius: 10, background: '#F0F4FB', cursor: 'pointer', border: '1px solid #E2E8F0' },
  userAvatar:   { width: 34, height: 34, borderRadius: '50%', background: '#1A237E', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 },
  userName:     { fontSize: 13, fontWeight: 700, color: '#1A237E' },
  userRole:     { fontSize: 10, color: '#6B7FA3', fontWeight: 600 },
  logoutBtn:    { padding: '8px 18px', borderRadius: 8, border: '1.5px solid #DC2626', background: 'transparent', color: '#DC2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
  loginBtn:     { padding: '10px 22px', borderRadius: 8, border: 'none', background: '#E8620A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", boxShadow: '0 2px 8px rgba(232,98,10,0.2)' },

  // ── Nav Bar ──
  navBar:       { background: '#1565C0', position: 'sticky', top: 0, zIndex: 200 },
  navInner:     { maxWidth: 1240, margin: '0 auto', padding: '0 40px', display: 'flex', gap: 0 },
  navLink:      { padding: '14px 20px', border: 'none', background: 'transparent', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", borderRight: '1px solid rgba(255,255,255,0.12)', letterSpacing: 0.2 },

  // ── News Ticker ──
  tickerBar:    { background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '10px 40px', display: 'flex', alignItems: 'center', gap: 16 },
  tickerLabel:  { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  tickerLabelNew: { background: '#DC2626', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 3, letterSpacing: 1, animation: 'pulse 2s infinite' },
  tickerLabelText: { fontSize: 13, fontWeight: 700, color: '#1A237E' },
  tickerContent: { flex: 1, overflow: 'hidden', animation: 'tickerFade 0.4s ease-out' },
  tickerText:   { fontSize: 13, color: '#4A5568', fontWeight: 500 },
  tickerNav:    { display: 'flex', gap: 4 },
  tickerBtn:    { width: 28, height: 28, borderRadius: '50%', border: '1px solid #D8E2F0', background: '#F7F9FC', color: '#1A237E', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },

  // ── Hero ──
  hero:         { position: 'relative', height: 440, overflow: 'hidden' },
  heroImgWrap:  { position: 'absolute', inset: 0 },
  heroImg:      { width: '100%', height: '100%', objectFit: 'cover' },
  heroOverlay:  { position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(26,35,126,0.92) 0%, rgba(26,35,126,0.75) 40%, rgba(21,101,192,0.5) 70%, rgba(21,101,192,0.3) 100%)' },
  heroContent:  { position: 'relative', maxWidth: 1240, margin: '0 auto', padding: '0 40px', height: '100%', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 40, alignItems: 'center' },
  heroLeft:     {},
  heroWelcome:  { display: 'inline-block', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: 6, fontSize: 14, color: '#fff', fontWeight: 600, marginBottom: 18 },
  heroTitle:    { fontFamily: "'Noto Serif', serif", fontSize: 'clamp(28px, 3.2vw, 42px)', fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: 14 },
  heroSub:      { fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 28, maxWidth: 500 },
  heroBtns:     { display: 'flex', gap: 12, flexWrap: 'wrap' },
  heroBtnPrimary: { padding: '13px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', background: '#FF9933', color: '#fff', fontFamily: "'DM Sans',sans-serif", boxShadow: '0 4px 14px rgba(255,153,51,0.35)' },
  heroBtnSecondary: { padding: '13px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)', fontFamily: "'DM Sans',sans-serif", backdropFilter: 'blur(8px)' },
  heroBtnOutline: { padding: '13px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(255,255,255,0.2)', fontFamily: "'DM Sans',sans-serif" },

  // ── Leadership Glass Card (Hero Sidebar) ──
  leadershipGlassCard: { background: 'rgba(255,255,255,0.09)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 16, padding: '24px 22px', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 350, justifySelf: 'end' },
  leadershipGlassHeader: { fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(255,255,255,0.6)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 },
  leadershipLiveDot: { width: 8, height: 8, borderRadius: '50%', background: '#FF9933', display: 'inline-block', boxShadow: '0 0 8px #FF9933', animation: 'pulse 2s infinite' },
  leaderSingleCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'default' },
  leaderGlassImgWrap: { width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.15)', background: '#F7F9FC', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  leaderGlassImg: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' },
  leaderGlassRole: { fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  leaderGlassName: { fontSize: 13, color: '#FFFFFF', fontWeight: 700, lineHeight: 1.25 },

  // ── Cabinet Ministers Belt ──
  cabinetSection: { padding: '40px 0', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' },
  cabinetGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, justifyContent: 'center' },
  cabinetCard: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 12px 16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(15,37,87,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'default' },
  cabinetImgWrap: { width: 84, height: 84, borderRadius: '50%', overflow: 'hidden', marginBottom: 12, border: '3px solid #1A237E', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', background: '#F7F9FC', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cabinetImg: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' },
  cabinetName: { fontSize: 13, fontWeight: 700, color: '#1A237E', marginBottom: 4, lineHeight: 1.2, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cabinetRole: { fontSize: 10, color: '#E8620A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  cabinetGovt: { fontSize: 10, color: '#6B7FA3', fontWeight: 600 },

  // ── Sections ──
  sectionWhite: { padding: '64px 0', background: '#fff' },
  sectionLight: { padding: '64px 0', background: '#F7F9FC' },
  sectionDark:  { padding: '64px 0', background: '#1A237E' },
  sectionInner: { maxWidth: 1240, margin: '0 auto', padding: '0 40px' },
  sectionHead:  { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 },
  sectionHeadAccent: { width: 5, height: 28, borderRadius: 3, background: '#1565C0' },
  sectionTitle: { fontFamily: "'Noto Serif', serif", fontSize: 26, fontWeight: 700, color: '#1A237E' },
  sectionSub:   { fontSize: 14, color: '#6B7FA3', lineHeight: 1.6, marginBottom: 36, paddingLeft: 17 },

  // ── Service Cards ──
  servicesGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 },
  serviceCard:  { background: '#fff', borderRadius: 12, padding: '24px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', border: '1px solid #F0F4FB' },
  serviceIcon:  { width: 52, height: 52, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  serviceTitle: { fontWeight: 700, fontSize: 15, color: '#1A237E', marginBottom: 4 },
  serviceDesc:  { fontSize: 12, color: '#6B7FA3', lineHeight: 1.5 },
  serviceArrow: { fontSize: 28, fontWeight: 300, marginLeft: 'auto', flexShrink: 0 },

  // ── Counters ──
  countersGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 18 },
  counterCard:  { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '26px 20px', textAlign: 'center', backdropFilter: 'blur(8px)' },
  counterIcon:  { width: 50, height: 50, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' },
  counterValue: { fontSize: 32, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.5px' },
  counterLabel: { fontSize: 11, color: '#ffffff', fontWeight: 500, marginBottom: 14 },
  progressWrap: { width: '100%', height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  progressBar:  { height: '100%', borderRadius: 100, transition: 'width 1.8s ease-out' },

  // ── Initiatives ──
  initCarousel: { position: 'relative', padding: '0 20px' },
  initArrow:    { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #D8E2F0', background: '#fff', color: '#1A237E', fontSize: 18, fontWeight: 700, cursor: 'pointer', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  initTrack:    { overflow: 'hidden' },
  initCard:     { minWidth: 230, background: '#fff', borderRadius: 12, padding: '28px 22px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', flexShrink: 0, border: '1px solid #F0F4FB' },
  initTitle:    { fontWeight: 700, fontSize: 16, color: '#1A237E', marginBottom: 8 },
  initDesc:     { fontSize: 13, color: '#6B7FA3', lineHeight: 1.6, marginBottom: 16 },
  initBadge:    { display: 'inline-block', padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700 },

  // ── Notices ──
  noticeBoard:  { background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' },
  noticeItem:   { display: 'flex', alignItems: 'center', gap: 14, padding: '16px 22px', borderBottom: '1px solid #F0F4FB' },
  noticeDot:    { width: 8, height: 8, borderRadius: '50%', background: '#DC2626', flexShrink: 0 },
  noticeText:   { flex: 1, fontSize: 13, color: '#374151', lineHeight: 1.5 },
  noticeDate:   { fontSize: 11, color: '#9EB3CC', flexShrink: 0, fontWeight: 500 },

  // ── About ──
  aboutGrid:    { display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: 48, alignItems: 'center' },
  aboutP:       { fontSize: 15, color: '#4A5E78', lineHeight: 1.8, marginBottom: 28, paddingLeft: 17 },
  aboutFeatures:{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, paddingLeft: 17 },
  aboutFeatureRow: { display: 'flex', alignItems: 'center', gap: 12 },
  aboutFeatureDot: { width: 8, height: 8, borderRadius: '50%', background: '#FF9933', flexShrink: 0 },
  aboutFeatureText: { fontSize: 14, color: '#374151', fontWeight: 500 },
  aboutBtn:     { padding: '14px 32px', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', border: 'none', background: '#1A237E', color: '#fff', fontFamily: "'DM Sans',sans-serif", marginLeft: 17 },
  aboutImgWrap: { borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '3px solid #E8ECF0' },
  aboutImg:     { width: '100%', height: 280, objectFit: 'cover', display: 'block' },
  aboutImgLabel:{ background: '#1A237E', padding: '12px 16px', textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600, letterSpacing: 0.3 },

  // ── Footer ──
  footer:       { background: '#0D1642' },
  footerTriColor: { display: 'flex' },
  footerInner:  { maxWidth: 1240, margin: '0 auto', padding: '0 40px' },
  footerGrid:   { display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1.2fr', gap: 36, padding: '44px 0 36px' },
  footerBrand:  { fontFamily: "'Noto Serif', serif", fontSize: 17, fontWeight: 700, color: '#fff' },
  footerBrandSub: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  footerDesc:   { fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 },
  footerHeading:{ fontWeight: 700, color: '#fff', fontSize: 13, marginBottom: 14, letterSpacing: 0.5, textTransform: 'uppercase' },
  footerLink:   { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 10, cursor: 'pointer', lineHeight: 1.4 },
  footerContact:{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 8, lineHeight: 1.4 },
  footerBottom: { borderTop: '1px solid rgba(255,255,255,0.08)', padding: '20px 0', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)' },
};
