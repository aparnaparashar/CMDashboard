import { useState } from 'react';
import { useLang, tx } from '../../context/LanguageContext';
import HeaderNavbar from '../../components/layout/HeaderNavbar';
import toast, { Toaster } from 'react-hot-toast';

export default function Contact() {
  const { lang } = useLang();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error(lang === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें।' : 'Please fill all required fields.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitted(true);
      setSubmitting(false);
      toast.success(lang === 'hi' ? 'आपका संदेश प्राप्त हो गया है!' : 'Your message has been received!');
    }, 1200);
  };

  const helplineCards = [
    { title: lang === 'hi' ? 'टोल-फ्री हेल्पलाइन' : 'Toll-Free Helpline', number: '1800-111-555', desc: lang === 'hi' ? '24/7 शिकायत पंजीकरण और पूछताछ' : '24/7 grievance registration and inquiry' },
    { title: lang === 'hi' ? 'दिल्ली सचिवालय' : 'Delhi Secretariat', number: '011-23392020', desc: lang === 'hi' ? 'सामान्य प्रशासनिक पूछताछ' : 'General administrative inquiry' },
    { title: lang === 'hi' ? 'डोरस्टेप डिलीवरी' : 'Doorstep Delivery', number: '1076', desc: lang === 'hi' ? 'सरकारी सेवाओं की डोरस्टेप डिलीवरी हेल्पलाइन' : 'Doorstep delivery of government services' },
    { title: lang === 'hi' ? 'एंटी-करप्शन हेल्पलाइन' : 'Anti-Corruption Helpline', number: '1031', desc: lang === 'hi' ? 'भ्रष्टाचार से संबंधित शिकायतें दर्ज करें' : 'File complaints related to corruption' }
  ];

  const officialDirectory = [
    { office: lang === 'hi' ? 'उपराज्यपाल कार्यालय (LG Office)' : 'LG Secretariat', person: 'Shri Taranjit Singh Sandhu', email: 'lgoffice.delhi@nic.in', phone: '011-23975000' },
    { office: lang === 'hi' ? 'मुख्यमंत्री कार्यालय (CM Office)' : 'Chief Minister Office', person: 'Smt. Rekha Gupta', email: 'cm.delhi@gov.in', phone: '011-23392030' },
    { office: lang === 'hi' ? 'नोडल शिकायत अधिकारी' : 'Nodal Grievance Officer', person: 'Shri Parvesh Singh', email: 'nodal.grievance@delhi.gov.in', phone: '011-23392455' },
    { office: lang === 'hi' ? 'तकनीकी सहायता डेस्क' : 'IT Helpdesk & Support', person: 'National Informatics Centre', email: 'support-crm.delhi@nic.in', phone: '011-23392265' }
  ];

  return (
    <div style={styles.page}>
      <Toaster position="top-right" />
      <HeaderNavbar activeTab="contact" />

      {/* Hero Header */}
      <div style={styles.heroBanner}>
        <div style={styles.heroInner}>
          <h1 style={styles.heroTitle}>{tx('Contact Us', lang)}</h1>
          <p style={styles.heroSub}>
            {lang === 'hi' 
              ? 'दिल्ली राष्ट्रीय राजधानी क्षेत्र सरकार के संपर्क केंद्र में आपका स्वागत है। हम आपकी शिकायतों के समाधान में सहायता के लिए यहां हैं।' 
              : 'Welcome to the Government of NCT of Delhi Contact Center. We are here to assist you with the redressal of your grievances.'}
          </p>
        </div>
      </div>

      <div style={styles.container}>
        {/* Helplines Row */}
        <div style={styles.helplineGrid}>
          {helplineCards.map((h, i) => (
            <div key={i} style={styles.helplineCard}>
              <div style={styles.helplineTitle}>{h.title}</div>
              <div style={styles.helplineNumber}>{h.number}</div>
              <div style={styles.helplineDesc}>{h.desc}</div>
            </div>
          ))}
        </div>

        {/* Form and Map Grid */}
        <div style={styles.contentGrid}>
          {/* Inquiry Form */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>{lang === 'hi' ? 'पूछताछ या संदेश भेजें' : 'Send an Inquiry / Message'}</h2>
              <p style={styles.cardSubtitle}>{lang === 'hi' ? 'शिकायत से जुड़े प्रश्नों के लिए कृपया यह फॉर्म भरें' : 'Fill out this form for queries regarding the portal or grievance handling'}</p>
            </div>

            {submitted ? (
              <div style={styles.successWrapper}>

                <h3 style={styles.successTitle}>{lang === 'hi' ? 'संदेश सफलतापूर्वक भेजा गया!' : 'Message Sent Successfully!'}</h3>
                <p style={styles.successText}>
                  {lang === 'hi' 
                    ? 'आपकी पूछताछ दर्ज कर ली गई है। हमारा शिकायत प्रकोष्ठ जल्द ही आपके ईमेल पर उत्तर भेजेगा।' 
                    : 'Your query has been recorded. Our grievance cell will respond to your email shortly.'}
                </p>
                <button style={styles.btnPrimary} onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
                }}>
                  {lang === 'hi' ? 'नया संदेश भेजें' : 'Send Another Message'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.label}>{lang === 'hi' ? 'पूरा नाम *' : 'Full Name *'}</label>
                    <input type="text" style={styles.input} required value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder={lang === 'hi' ? 'अपना नाम दर्ज करें' : 'Enter your name'} />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.label}>{lang === 'hi' ? 'ईमेल पता *' : 'Email Address *'}</label>
                    <input type="email" style={styles.input} required value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder={lang === 'hi' ? 'अपना ईमेल दर्ज करें' : 'Enter your email'} />
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.label}>{lang === 'hi' ? 'फ़ोन नंबर' : 'Phone Number'}</label>
                    <input type="tel" style={styles.input} value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={lang === 'hi' ? 'अपना फ़ोन नंबर दर्ज करें' : 'Enter your phone number'} />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.label}>{lang === 'hi' ? 'विषय' : 'Subject'}</label>
                    <input type="text" style={styles.input} value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      placeholder={lang === 'hi' ? 'पूछताछ का विषय' : 'Subject of query'} />
                  </div>
                </div>

                <div style={styles.formField}>
                  <label style={styles.label}>{lang === 'hi' ? 'आपका संदेश *' : 'Your Message *'}</label>
                  <textarea style={{ ...styles.input, height: 120, resize: 'vertical' }} required value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    placeholder={lang === 'hi' ? 'अपना संदेश यहां लिखें...' : 'Write your message here...'} />
                </div>

                <button type="submit" style={{ ...styles.btnPrimary, width: '100%', padding: '12px', fontSize: '15px' }} disabled={submitting}>
                  {submitting ? (lang === 'hi' ? 'भेज रहा है...' : 'Sending...') : (lang === 'hi' ? 'संदेश भेजें' : 'Send Message')}
                </button>
              </form>
            )}
          </div>

          {/* Location & Info Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>{lang === 'hi' ? 'कार्यालय मुख्यालय' : 'Office Headquarters'}</h2>
              <p style={styles.cardSubtitle}>{lang === 'hi' ? 'आधिकारिक पत्राचार और व्यक्तिगत रूप से शिकायतें दर्ज करने के लिए' : 'For official correspondence and in-person grievance registration'}</p>
            </div>

            <div style={styles.addressBlock}>
              <div>
                <div style={styles.addressTitle}>{lang === 'hi' ? 'दिल्ली सचिवालय (मुख्य मुख्यालय)' : 'Delhi Secretariat (Main HQ)'}</div>
                <div style={styles.addressText}>
                  {lang === 'hi' 
                    ? 'प्रथम तल, ए-विंग, आई.पी. एस्टेट, नई दिल्ली - 110002' 
                    : '1st Floor, A-Wing, I.P. Estate, New Delhi - 110002'}
                </div>
              </div>
            </div>

            {/* Embedded Mock Map Grid */}
            <div style={styles.mapContainer}>
              <div style={styles.mapBanner}>{lang === 'hi' ? 'दिल्ली सचिवालय मानचित्र' : 'Delhi Secretariat Map'}</div>
              <div style={styles.mapContent}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1A237E' }}>IP Estate, Ring Road, New Delhi</div>
                <div style={{ fontSize: 11, color: '#6B7FA3', marginTop: 4 }}>Lat: 28.6295° N | Lng: 77.2476° E</div>
                <div style={styles.mapMarker}>HQ</div>
              </div>
            </div>

            <div style={{ ...styles.addressBlock, marginTop: 20 }}>
              <div>
                <div style={styles.addressTitle}>{lang === 'hi' ? 'सामान्य ईमेल पूछताछ' : 'General Email Queries'}</div>
                <div style={styles.addressText}>gov.grievance.system@gmail.com</div>
              </div>
            </div>
          </div>
        </div>

        {/* Directory Section */}
        <div style={{ ...styles.card, marginTop: 24 }}>
          <div style={{ ...styles.cardHeader, borderBottom: '1px solid #E8ECF0', paddingBottom: 16 }}>
            <h2 style={styles.cardTitle}>{lang === 'hi' ? 'महत्वपूर्ण अधिकारियों की डायरेक्टरी' : 'Key Government Officials Directory'}</h2>
            <p style={styles.cardSubtitle}>{lang === 'hi' ? 'त्वरित पत्राचार के लिए विभागीय संपर्क विवरण' : 'Direct office contact details for escalated grievance monitoring'}</p>
          </div>

          <div style={{ overflowX: 'auto', marginTop: 12 }}>
            <table style={styles.table}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={styles.th}>{lang === 'hi' ? 'विभाग / कार्यालय' : 'Office / Department'}</th>
                  <th style={styles.th}>{lang === 'hi' ? 'प्रभारी अधिकारी' : 'Officer In-charge'}</th>
                  <th style={styles.th}>{lang === 'hi' ? 'आधिकारिक ईमेल' : 'Official Email'}</th>
                  <th style={styles.th}>{lang === 'hi' ? 'फ़ोन नंबर' : 'Phone Connection'}</th>
                </tr>
              </thead>
              <tbody>
                {officialDirectory.map((od, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F0F4FB' }}>
                    <td style={{ ...styles.td, fontWeight: 700, color: '#1A237E' }}>{od.office}</td>
                    <td style={styles.td}>{od.person}</td>
                    <td style={{ ...styles.td, color: '#E8620A', fontWeight: 500 }}>{od.email}</td>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 13 }}>{od.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tri-color Accent Footer Spacer */}
      <div style={styles.triSpacer} />
    </div>
  );
}

const styles = {
  page: { fontFamily: "'DM Sans', sans-serif", background: '#F4F6FB', minHeight: '100vh' },
  heroBanner: { backgroundImage: "linear-gradient(135deg, rgba(26,35,126,0.8) 0%, rgba(21,101,192,0.55) 100%), url('/delhi-hero.png')", backgroundSize: 'cover', backgroundPosition: 'center', padding: '48px 40px', color: '#fff', borderBottom: '4px solid #FF9933' },
  heroInner: { maxWidth: 1100, margin: '0 auto', textAlign: 'center' },
  heroTitle: { fontFamily: "'Noto Serif', serif", fontSize: 32, fontWeight: 700, marginBottom: 12 },
  heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.75)', maxWidth: 700, margin: '0 auto', lineHeight: 1.6 },
  container: { maxWidth: 1100, margin: '0 auto', padding: '32px 20px' },

  helplineGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16, marginBottom: 24 },
  helplineCard: { background: '#fff', borderRadius: 12, padding: 20, textAlign: 'center', boxShadow: '0 2px 8px rgba(15,37,87,0.06)', borderTop: '4px solid #1565C0' },
  helplineIcon: { fontSize: 32, marginBottom: 8 },
  helplineTitle: { fontSize: 13, fontWeight: 700, color: '#6B7FA3', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  helplineNumber: { fontSize: 24, fontWeight: 800, color: '#1A237E', marginBottom: 8 },
  helplineDesc: { fontSize: 12, color: '#6B7FA3', lineHeight: 1.4 },

  contentGrid: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 },
  card: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(15,37,87,0.06)', display: 'flex', flexDirection: 'column', gap: 16 },
  cardHeader: { borderBottom: '1.5px solid #F0F4FB', paddingBottom: 12, marginBottom: 4 },
  cardTitle: { fontFamily: "'Noto Serif', serif", fontSize: 18, fontWeight: 700, color: '#1A237E', margin: 0 },
  cardSubtitle: { fontSize: 12, color: '#6B7FA3', margin: '4px 0 0', lineHeight: 1.4 },

  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  formRow: { display: 'flex', gap: 14, flexWrap: 'wrap' },
  formField: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 },
  label: { fontSize: 12, fontWeight: 700, color: '#1A237E' },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #D8E2F0', borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' },

  btnPrimary: { padding: '10px 24px', background: '#E8620A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderBottom: '3px solid #C65105', transition: 'all 0.1s' },

  successWrapper: { textAlign: 'center', padding: '32px 0' },
  successTitle: { fontFamily: "'Noto Serif', serif", fontSize: 20, fontWeight: 700, color: '#138808', marginBottom: 8 },
  successText: { fontSize: 13, color: '#3A4E70', lineHeight: 1.6, marginBottom: 24, maxWidth: 350, margin: '0 auto 24px' },

  addressBlock: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  addressIcon: { fontSize: 24, flexShrink: 0 },
  addressTitle: { fontWeight: 700, fontSize: 14, color: '#1A237E' },
  addressText: { fontSize: 13, color: '#6B7FA3', marginTop: 4, lineHeight: 1.5 },

  mapContainer: { background: '#ECEFF1', borderRadius: 10, overflow: 'hidden', border: '1px solid #CFD8DC', marginTop: 12 },
  mapBanner: { background: '#CFD8DC', padding: '6px 12px', fontSize: 11, fontWeight: 700, color: '#37474F' },
  mapContent: { padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' },
  mapMarker: { background: '#DC2626', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, marginTop: 12 },

  table: { width: '100%', borderCollapse: 'collapse', marginTop: 12 },
  th: { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7FA3', textTransform: 'uppercase', letterSpacing: 0.5 },
  td: { padding: '12px', fontSize: 13, color: '#3A4E70' },
  triSpacer: { height: 10, background: 'linear-gradient(to right, #FF9933 33.3%, #FFF 33.3%, #FFF 66.6%, #138808 66.6%)', marginTop: 40 }
};
