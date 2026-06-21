import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang, tx } from '../../context/LanguageContext';
import LanguageToggle from './LanguageToggle';

export default function HeaderNavbar({ activeTab }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { lang } = useLang();
  const T = (key) => tx(key, lang);

  const firstName = user?.name?.split(' ')[0] || 'Citizen';

  const navLinks = [
    { label: lang === 'hi' ? 'होम' : 'Home',           path: user ? '/citizen/home' : '/', public: true, key: 'home' },
    { label: lang === 'hi' ? 'शिकायत दर्ज करें' : 'File Complaint', path: '/citizen/submit', public: false, key: 'submit' },
    { label: lang === 'hi' ? 'शिकायत ट्रैक करें' : 'Track Complaint', path: '/citizen/track', public: true, key: 'track' },
    ...(user?.role === 'admin' ? [
      { label: lang === 'hi' ? 'प्रशासक डैशबोर्ड' : 'Admin Dashboard', path: '/admin/dashboard', public: false, key: 'dashboard' },
      { label: lang === 'hi' ? 'शिकायतें' : 'Complaints', path: '/admin/complaints', public: false, key: 'complaints' },
      { label: lang === 'hi' ? 'अधिकारी प्रबंधन' : 'Officers', path: '/admin/officers', public: false, key: 'officers' },
      { label: lang === 'hi' ? 'विश्लेषण' : 'Analytics', path: '/admin/analytics', public: false, key: 'analytics' }
    ] : []),
    ...(user?.role === 'officer' ? [{ label: lang === 'hi' ? 'अधिकारी डैशबोर्ड' : 'Officer Dashboard', path: '/officer/dashboard', public: false, key: 'officer-dashboard' }] : []),
    ...(user?.role === 'citizen' ? [{ label: lang === 'hi' ? 'मेरा डैशबोर्ड' : 'My Dashboard', path: '/citizen/dashboard', public: false, key: 'citizen-dashboard' }] : []),
    { label: lang === 'hi' ? 'सार्वजनिक डैशबोर्ड' : 'Public Dashboard', path: '/public', public: true, key: 'public' },
    { label: lang === 'hi' ? 'सूचनाएं' : 'Notifications',  path: '/notifications', public: false, key: 'notifications' },
    { label: lang === 'hi' ? 'संपर्क करें' : 'Contact Us',     path: '/contact', public: true, key: 'contact' },
  ];

  return (
    <>
      <style>{`
        .nav-link-btn:hover { background: rgba(255,255,255,0.08) !important; }
      `}</style>

      {/* MAIN HEADER */}
      <header style={styles.header}>
        <div style={{ ...styles.headerLeft, cursor: 'pointer' }} onClick={() => navigate(user ? '/citizen/home' : '/')}>
          <img src="/ashoka-emblem.png" alt="National Emblem" style={styles.emblemImg} />
          <div>
            <div style={styles.headerTitle}>
              {lang === 'hi' ? 'लोक शिकायत निवारण पोर्टल' : 'Public Grievance Redressal Portal'}
            </div>
            <div style={styles.headerSubtitle}>
              {lang === 'hi' ? 'दिल्ली राष्ट्रीय राजधानी क्षेत्र सरकार · स्मार्ट सार्वजनिक सेवा CRM' : 'Government of NCT of Delhi · Smart Public Service CRM'}
            </div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.flagWrap}>
            <div style={{ width: 48, height: 10, background: '#FF9933', borderRadius: '3px 3px 0 0' }} />
            <div style={{ width: 48, height: 10, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', border: '1px solid #000080' }} />
            </div>
            <div style={{ width: 48, height: 10, background: '#138808', borderRadius: '0 0 3px 3px' }} />
          </div>

          <LanguageToggle />

          {user ? (
            <>
              <div style={styles.userChip} onClick={() => {
                if (user.role === 'admin') navigate('/admin/profile');
                else if (user.role === 'officer') navigate('/officer/profile');
                else navigate('/citizen/profile');
              }}>
                <div style={styles.userAvatar}>{firstName.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={styles.userName}>{firstName}</div>
                  <div style={styles.userRole}>
                    {user.role === 'admin'
                      ? (lang === 'hi' ? 'प्रशासक' : 'Admin')
                      : user.role === 'officer'
                      ? (lang === 'hi' ? 'अधिकारी' : 'Officer')
                      : (lang === 'hi' ? 'नागरिक' : 'Citizen')}
                  </div>
                </div>
              </div>
              <button style={styles.logoutBtn} onClick={logout}>{lang === 'hi' ? 'लॉगआउट' : 'Logout'}</button>
            </>
          ) : (
            <button style={styles.loginBtn} onClick={() => navigate('/login')}>
              {lang === 'hi' ? 'रजिस्टर / लॉगिन' : 'Register / Login'}
            </button>
          )}
        </div>
      </header>

      {/* NAVIGATION BAR */}
      <nav style={styles.navBar}>
        <div style={styles.navInner}>
          {navLinks.map(({ label, path, public: isPublic, key }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                className="nav-link-btn"
                style={{
                  ...styles.navLink,
                  background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                  borderBottom: isActive ? '3px solid #FF9933' : 'none'
                }}
                onClick={() => {
                  if (!isPublic && !user) navigate('/login');
                  else navigate(path);
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

const styles = {
  header:       { background: '#fff', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E8ECF0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', fontFamily: "'DM Sans', sans-serif" },
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
  navBar:       { background: '#1565C0', position: 'sticky', top: 0, zIndex: 200, fontFamily: "'DM Sans', sans-serif" },
  navInner:     { maxWidth: 1240, margin: '0 auto', padding: '0 40px', display: 'flex', gap: 0, alignItems: 'center', height: 56 },
  navLink:      { padding: '0 20px', border: 'none', background: 'transparent', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", borderRight: '1px solid rgba(255,255,255,0.12)', letterSpacing: 0.2, height: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' },
};
