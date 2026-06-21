// ps-crm-frontend/src/pages/Register.js
// CHANGES: OTP verification step added between form submit and account creation.
// All existing styling, language logic, officer flow, and layout preserved exactly.

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang, tx } from '../context/LanguageContext';
import LanguageToggle from '../components/layout/LanguageToggle';
import API from '../api';

// ── OTP 6-box input ───────────────────────────────────────────────────────────
function OTPInput({ value, onChange, disabled }) {
  const inputs = useRef([]);
  const digits  = value.split('');

  const handleKey = (e, idx) => {
    if (e.key === 'Backspace') {
      const next = [...digits]; next[idx] = '';
      onChange(next.join(''));
      if (idx > 0) inputs.current[idx - 1]?.focus();
      return;
    }
    if (e.key === 'ArrowLeft'  && idx > 0) { inputs.current[idx - 1]?.focus(); return; }
    if (e.key === 'ArrowRight' && idx < 5) { inputs.current[idx + 1]?.focus(); return; }
  };

  const handleChange = (e, idx) => {
    const val  = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...digits]; next[idx] = val;
    onChange(next.join(''));
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '20px 0' }}>
      {[0,1,2,3,4,5].map(i => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ''}
          disabled={disabled}
          onChange={e => handleChange(e, i)}
          onKeyDown={e => handleKey(e, i)}
          onPaste={handlePaste}
          autoFocus={i === 0}
          style={{
            width: 44, height: 52, textAlign: 'center',
            fontSize: 22, fontWeight: 700,
            border: `2px solid ${digits[i] ? '#0F2557' : '#D8E2F0'}`,
            borderRadius: 10, outline: 'none',
            background: digits[i] ? '#EEF2FF' : '#fff',
            color: '#0F2557', transition: 'all 0.15s',
            fontFamily: "'Courier New', monospace",
            opacity: disabled ? 0.6 : 1,
          }}
        />
      ))}
    </div>
  );
}

// ── Countdown timer ───────────────────────────────────────────────────────────
function Countdown({ seconds, onExpire, key: resetKey }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    setRemaining(seconds);
    const interval = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(interval); onExpire?.(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resetKey]); // eslint-disable-line

  const m = String(Math.floor(remaining / 60)).padStart(2, '0');
  const s = String(remaining % 60).padStart(2, '0');
  return (
    <span style={{ fontWeight: 700, color: remaining < 60 ? '#C62828' : '#0F2557', fontVariantNumeric: 'tabular-nums' }}>
      {m}:{s}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { lang }  = useLang();

  const [registerType,   setRegisterType]   = useState('citizen');
  const [form,           setForm]           = useState({ name: '', email: '', password: '', confirm: '', phone: '', department: 'PWD Department' });
  const [termsAccepted,  setTermsAccepted]  = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [pendingSuccess, setPendingSuccess] = useState(false);

  // ── OTP state ──────────────────────────────────────────────────────────────
  const [step,        setStep]        = useState('form'); // 'form' | 'otp'
  const [otp,         setOtp]         = useState('');
  const [otpExpired,  setOtpExpired]  = useState(false);
  const [resending,   setResending]   = useState(false);
  const [countdownKey,setCountdownKey]= useState(0); // increment to reset timer

  const departments = ['PWD Department', 'Jal Board', 'Electricity Board', 'Municipal Corp', 'Health Department', 'Education Dept', 'Revenue Dept', 'Other'];

  // ── Validation (same as original handleRegister) ──────────────────────────
  const validate = () => {
    if (!form.name || !form.email || !form.password) {
      setError(tx('Please fill all required fields', lang)); return false;
    }
    if (form.password !== form.confirm) {
      setError(tx('Passwords do not match', lang)); return false;
    }
    if (form.password.length < 6) {
      setError(tx('Password must be at least 6 characters', lang)); return false;
    }
    if (form.phone && form.phone.length !== 10) {
      setError(lang === 'hi' ? 'फ़ोन नंबर 10 अंकों का होना चाहिए' : 'Phone number must be exactly 10 digits');
      return false;
    }
    if (!termsAccepted) {
      setError(lang === 'hi' ? 'कृपया सेवा की शर्तों को स्वीकार करें।' : 'Please accept the Terms of Service before registering.');
      return false;
    }
    if (registerType === 'officer' && !form.department) {
      setError(lang === 'hi' ? 'कृपया विभाग चुनें' : 'Please select a department');
      return false;
    }
    return true;
  };

  // ── Step 1: Send OTP ───────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await API.post('/auth/send-otp', {
        name:  form.name,
        email: form.email,
        password: form.password,
        role:  registerType,
      });
      setStep('otp');
      setOtp('');
      setOtpExpired(false);
      setCountdownKey(k => k + 1);
    } catch (err) {
      setError(err.response?.data?.message || (lang === 'hi' ? 'OTP भेजने में त्रुटि हुई' : 'Failed to send OTP. Please try again.'));
    }
    setLoading(false);
  };

  // ── Step 2: Verify OTP → Register ─────────────────────────────────────────
  const handleVerify = async () => {
    setError('');
    if (otp.length < 6) {
      setError(lang === 'hi' ? 'कृपया 6 अंकों का OTP दर्ज करें' : 'Please enter the complete 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      const res = await API.post('/auth/verify-otp-and-register', {
        name:       form.name,
        email:      form.email,
        password:   form.password,
        phone:      form.phone,
        role:       registerType,
        department: registerType === 'officer' ? form.department : undefined,
        otp,
      });

      if (res.data.pending) {
        setPendingSuccess(true);
        setLoading(false);
        return;
      }

      login(res.data.data);
      navigate('/citizen/home');
    } catch (err) {
      setError(err.response?.data?.message || (lang === 'hi' ? 'सत्यापन विफल हुआ' : 'Verification failed. Please try again.'));
    }
    setLoading(false);
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResend = async () => {
    setResending(true); setError('');
    try {
      await API.post('/auth/resend-otp', { email: form.email, name: form.name });
      setOtp('');
      setOtpExpired(false);
      setCountdownKey(k => k + 1);
    } catch (err) {
      setError(err.response?.data?.message || (lang === 'hi' ? 'OTP पुनः भेजने में त्रुटि हुई' : 'Failed to resend OTP.'));
    }
    setResending(false);
  };

  // ── Officer pending screen (identical to original) ────────────────────────
  if (pendingSuccess) {
    return (
      <div style={{ minHeight: '100vh', background: '#F4F6FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 48, maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(15,37,87,0.1)' }}>
          <h2 style={{ fontFamily: "'Noto Serif',serif", fontSize: 24, fontWeight: 700, color: '#0F2557', marginBottom: 12 }}>
            {lang === 'hi' ? 'पंजीकरण प्राप्त हुआ!' : 'Registration Submitted!'}
          </h2>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 24 }}>
            {lang === 'hi'
              ? `${form.name}, आपकी अधिकारी पंजीकरण अर्जी सफलतापूर्वक जमा की गई है। एडमिन द्वारा समीक्षा के बाद आपको ईमेल पर सूचित किया जाएगा।`
              : `${form.name}, your officer registration request has been submitted successfully. You will be notified by email once an admin reviews your application.`}
          </p>
          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10, padding: 16, marginBottom: 28, textAlign: 'left' }}>
            <div style={{ fontWeight: 700, color: '#92400E', marginBottom: 8, fontSize: 14 }}>
              {lang === 'hi' ? 'अगले कदम:' : 'What happens next:'}
            </div>
            {[
              lang === 'hi' ? 'आपको एक पुष्टि ईमेल मिला है' : 'You received a confirmation email',
              lang === 'hi' ? 'एडमिन आपकी अर्जी की समीक्षा करेगा' : 'Admin will review your application',
              lang === 'hi' ? 'मंजूरी/अस्वीकृति पर ईमेल मिलेगा' : "You'll get an email on approval/rejection",
              lang === 'hi' ? 'मंजूरी के बाद लॉगिन करें' : 'Login once approved',
            ].map((s, i) => (
              <div key={i} style={{ fontSize: 13, color: '#78350F', marginBottom: 6 }}>{s}</div>
            ))}
          </div>
          <button
            onClick={() => navigate('/login')}
            style={{ width: '100%', padding: '13px', background: '#E8620A', color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            {lang === 'hi' ? 'लॉगिन पेज पर जाएं' : 'Go to Login Page'}
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={styles.container}>

      {/* Left Panel - identical to original */}
      <div style={styles.left}>
        <div style={styles.leftInner}>
          <div style={styles.leftLogo} onClick={() => navigate('/')}>
            <div style={styles.emblem}>🏛️</div>
            <div>
              <div style={styles.logoText}>{tx('PS-CRM Gov Portal', lang)}</div>
              <div style={styles.logoSub}>{tx('Smart Public Service CRM', lang)}</div>
            </div>
          </div>
          <h1 style={styles.leftH1}>{tx('Join the Digital Governance Platform', lang)}</h1>
          <p style={styles.leftP}>
            {tx('Register as a citizen to file complaints, track resolutions, and hold your government accountable.', lang)}
          </p>
          <div style={styles.features}>
            {[
              tx('File complaints in minutes', lang),
              tx('Real-time status tracking', lang),
              tx('Instant email notifications', lang),
              tx('Rate your experience', lang),
            ].map((text, i) => (
              <div key={i} style={styles.featureRow}>
                <div style={styles.featureDot} />
                <span style={styles.featureText}>{text}</span>
              </div>
            ))}
          </div>
          <div style={styles.flags}>
            {['#FF9933', '#FFF', '#138808'].map(c => (
              <div key={c} style={{ width: 32, height: 8, background: c, borderRadius: 2 }} />
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={styles.right}>
        <div style={{ position: 'absolute', top: 20, right: 28 }}>
          <LanguageToggle />
        </div>

        <div style={styles.form}>

          {/* ══════════════════════════════════════════════════════════
              STEP 1 - Registration form (identical to original)
          ══════════════════════════════════════════════════════════ */}
          {step === 'form' && (
            <>
              <h2 style={styles.formTitle}>{tx('Create Account', lang)}</h2>

              {/* Register type toggle */}
              <div style={styles.typeToggle}>
                <button
                  style={{ ...styles.typeBtn, ...(registerType === 'citizen' ? styles.typeBtnActive : {}) }}
                  onClick={() => { setRegisterType('citizen'); setError(''); }}>
                  {lang === 'hi' ? 'नागरिक' : 'Citizen'}
                </button>
                <button
                  style={{ ...styles.typeBtn, ...(registerType === 'officer' ? styles.typeBtnActive : {}) }}
                  onClick={() => { setRegisterType('officer'); setError(''); }}>
                  {lang === 'hi' ? 'अधिकारी' : 'Field Officer'}
                </button>
              </div>

              {registerType === 'officer' && (
                <div style={styles.officerNotice}>
                  <div style={{ fontWeight: 700, color: '#92400E', fontSize: 13, marginBottom: 4 }}>
                    {lang === 'hi' ? 'अधिकारी पंजीकरण' : 'Officer Registration'}
                  </div>
                  <div style={{ fontSize: 12, color: '#78350F', lineHeight: 1.5 }}>
                    {lang === 'hi'
                      ? 'अधिकारी खाते एडमिन अनुमोदन के बाद ही सक्रिय होते हैं। पंजीकरण के बाद आपको ईमेल मिलेगा।'
                      : 'Officer accounts require admin approval before you can login. You will be notified by email once reviewed'}
                  </div>
                </div>
              )}

              <p style={styles.formSub}>
                {registerType === 'officer'
                  ? (lang === 'hi' ? 'अधिकारी खाता बनाएं - एडमिन अनुमोदन आवश्यक' : 'Create officer account - admin approval required')
                  : tx('Register as a citizen to access the portal', lang)}
              </p>

              {error && <div style={styles.error}>{error}</div>}

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>{tx('Full Name *', lang)}</label>
                  <input
                    style={styles.input}
                    placeholder={tx('Your full name', lang)}
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>{tx('Phone Number', lang)}</label>
                  <input
                    style={styles.input}
                    placeholder={tx('10-digit mobile', lang)}
                    value={form.phone}
                    maxLength={10}
                    inputMode="numeric"
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setForm(f => ({ ...f, phone: val }));
                    }}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>{tx('Email Address *', lang)}</label>
                <input
                  style={styles.input}
                  type="email"
                  placeholder={tx('Your email address', lang)}
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>

              {registerType === 'officer' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>{lang === 'hi' ? 'विभाग *' : 'Department *'}</label>
                  <select
                    style={styles.input}
                    value={form.department}
                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                    {departments.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              )}

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>{tx('Password *', lang)}</label>
                  <input
                    style={styles.input}
                    type="password"
                    placeholder={tx('Min 6 characters', lang)}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>{tx('Confirm Password *', lang)}</label>
                  <input
                    style={styles.input}
                    type="password"
                    placeholder={tx('Repeat password', lang)}
                    value={form.confirm}
                    onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                  />
                </div>
              </div>

              <div style={{ ...styles.terms, alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="terms"
                  style={{ width: 16, height: 16, cursor: 'pointer', flexShrink: 0, accentColor: '#E8620A', margin: 0 }}
                  checked={termsAccepted}
                  onChange={e => { setTermsAccepted(e.target.checked); setError(''); }}
                />
                <label htmlFor="terms" style={{ fontSize: 13, color: '#6B7FA3', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {lang === 'hi' ? 'मैं ' : 'I agree to the '}
                  <span style={{ color: '#0F2557', fontWeight: 600 }}>{tx('Terms of Service', lang)}</span>
                  {lang === 'hi' ? ' और ' : ' and '}
                  <span style={{ color: '#0F2557', fontWeight: 600 }}>{tx('Privacy Policy', lang)}</span>
                  {lang === 'hi' ? ' से सहमत हूं' : ''}
                </label>
              </div>

              <button style={styles.btn} onClick={handleSendOTP} disabled={loading}>
                {loading
                  ? (lang === 'hi' ? 'OTP भेजा जा रहा है...' : 'Sending OTP...')
                  : registerType === 'officer'
                    ? (lang === 'hi' ? 'OTP भेजें और जारी रखें' : 'Send OTP & Continue')
                    : (lang === 'hi' ? 'OTP भेजें और जारी रखें' : 'Send OTP & Continue')}
              </button>

              <div style={styles.loginLink}>
                {tx('Already have an account?', lang)}{' '}
                <span onClick={() => navigate('/login')} style={{ color: '#0F2557', fontWeight: 700, cursor: 'pointer' }}>
                  {tx('Sign in here', lang)}
                </span>
              </div>

              <button style={styles.btnGuest} onClick={() => navigate('/public')}>
                {tx('Continue as Guest (View Public Dashboard)', lang)}
              </button>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════
              STEP 2 - OTP Verification  <- NEW
          ══════════════════════════════════════════════════════════ */}
          {step === 'otp' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>📧</div>
                <h2 style={styles.formTitle}>
                  {lang === 'hi' ? 'ईमेल सत्यापित करें' : 'Verify your email'}
                </h2>
                <p style={{ ...styles.formSub, marginBottom: 4 }}>
                  {lang === 'hi' ? 'हमने एक 6-अंकीय कोड भेजा है:' : 'We sent a 6-digit code to:'}
                </p>
                <p style={{ fontWeight: 700, color: '#0F2557', fontSize: 14, marginBottom: 0 }}>
                  {form.email}
                </p>
              </div>

              {error && <div style={styles.error}>{error}</div>}

              <OTPInput value={otp} onChange={setOtp} disabled={loading} />

              {!otpExpired ? (
                <p style={{ textAlign: 'center', fontSize: 13, color: '#6B7FA3', margin: '-8px 0 16px' }}>
                  {lang === 'hi' ? 'कोड समाप्त होगा ' : 'Code expires in '}
                  <Countdown key={countdownKey} seconds={600} onExpire={() => setOtpExpired(true)} />
                </p>
              ) : (
                <p style={{ textAlign: 'center', fontSize: 13, color: '#C62828', margin: '-8px 0 16px', fontWeight: 600 }}>
                  {lang === 'hi' ? 'OTP समाप्त हो गया। कृपया नया OTP मंगाएं।' : 'OTP has expired. Please request a new one.'}
                </p>
              )}

              <button
                style={{ ...styles.btn, opacity: (loading || otp.length < 6 || otpExpired) ? 0.5 : 1 }}
                onClick={handleVerify}
                disabled={loading || otp.length < 6 || otpExpired}>
                {loading
                  ? (lang === 'hi' ? 'सत्यापित हो रहा है...' : 'Verifying...')
                  : registerType === 'officer'
                    ? (lang === 'hi' ? 'सत्यापित करें और अर्जी जमा करें' : 'Verify & Submit Registration')
                    : (lang === 'hi' ? 'सत्यापित करें और खाता बनाएं' : 'Verify & Create Account')}
              </button>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16 }}>
                <button
                  onClick={handleResend}
                  disabled={resending}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0F2557', fontWeight: 700, fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>
                  {resending
                    ? (lang === 'hi' ? 'भेजा जा रहा है...' : 'Sending...')
                    : (lang === 'hi' ? '↻ OTP पुनः भेजें' : '↻ Resend OTP')}
                </button>
                <span style={{ color: '#D8E2F0' }}>|</span>
                <button
                  onClick={() => { setStep('form'); setOtp(''); setError(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7FA3', fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>
                  {lang === 'hi' ? '← ईमेल बदलें' : '← Change email'}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

// -- Styles - identical to your original --────────────────────────────────────
const styles = {
  container:     { display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans',sans-serif", position: 'relative' },
  left:          { flex: 1, backgroundImage: "linear-gradient(135deg, rgba(15,37,87,0.88) 0%, rgba(26,58,110,0.6) 60%), url('/delhi-hero.png')", backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' },
  leftInner:     { maxWidth: 440 },
  leftLogo:      { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48, cursor: 'pointer' },
  emblem:        { width: 50, height: 50, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff' },
  logoText:      { fontFamily: "'Noto Serif',serif", fontSize: 18, fontWeight: 700, color: '#fff' },
  logoSub:       { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  leftH1:        { fontFamily: "'Noto Serif',serif", fontSize: 34, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 16 },
  leftP:         { fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 36 },
  features:      { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 40 },
  featureRow:    { display: 'flex', alignItems: 'center', gap: 12 },
  featureDot:    { width: 8, height: 8, borderRadius: '50%', background: '#E8620A', flexShrink: 0 },
  featureText:   { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  flags:         { display: 'flex', flexDirection: 'column', gap: 3, width: 32 },
  right:         { width: 560, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: '#FAFBFE', position: 'relative' },
  form:          { width: '100%', maxWidth: 460 },
  formTitle:     { fontFamily: "'Noto Serif',serif", fontSize: 26, fontWeight: 700, color: '#0F2557', marginBottom: 16, textAlign: 'center' },
  typeToggle:    { display: 'flex', gap: 0, marginBottom: 20, border: '1.5px solid #D8E2F0', borderRadius: 10, overflow: 'hidden' },
  typeBtn:       { flex: 1, padding: '10px', border: 'none', background: '#fff', color: '#6B7FA3', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
  typeBtnActive: { background: '#0F2557', color: '#fff' },
  officerNotice: { background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: 8, padding: '12px 16px', marginBottom: 16 },
  formSub:       { fontSize: 14, color: '#6B7FA3', marginBottom: 20, textAlign: 'center' },
  formRow:       { display: 'flex', gap: 14 },
  formGroup:     { marginBottom: 18, flex: 1 },
  label:         { display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#3A4E70' },
  input:         { width: '100%', padding: '11px 14px', border: '1.5px solid #D8E2F0', borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: 'none', background: '#fff', boxSizing: 'border-box' },
  terms:         { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 },
  btn:           { width: '100%', padding: '13px', background: '#E8620A', color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
  error:         { background: '#FEE2E2', color: '#C62828', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 },
  loginLink:     { textAlign: 'center', fontSize: 13, color: '#6B7FA3', marginTop: 20 },
  btnGuest:      { width: '100%', padding: '12px', background: 'transparent', color: '#0F2557', border: '1.5px solid #D8E2F0', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", marginTop: 12 },
};