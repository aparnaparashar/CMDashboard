import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang, tx } from '../../context/LanguageContext';
import API from '../../api';
import HeaderNavbar from '../../components/layout/HeaderNavbar';

export default function OfficerProfilePage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { lang } = useLang();
  const T = (key) => tx(key, lang);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    password: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
      });
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await API.put(`/auth/profile/${user._id}`, {
        phone: form.phone,
        department: form.department,
      });
      if (res.data.success) {
        login({ ...user, ...res.data.data });
        setSuccess(lang === 'hi' ? 'प्रोफ़ाइल सफलतापूर्वक अपडेट किया गया!' : 'Profile updated successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || (lang === 'hi' ? 'प्रोफ़ाइल अपडेट करने में विफल' : 'Failed to update profile'));
    }
    setSaving(false);
  };

  const handlePasswordChange_submit = async () => {
    if (!passwordForm.password) {
      setError(lang === 'hi' ? 'वर्तमान पासवर्ड दर्ज करें' : 'Please enter current password');
      return;
    }
    if (!passwordForm.newPassword) {
      setError(lang === 'hi' ? 'नया पासवर्ड दर्ज करें' : 'Please enter new password');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError(lang === 'hi' ? 'नए पासवर्ड मेल नहीं खाते' : 'New passwords do not match');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await API.put(`/auth/profile/${user._id}`, {
        password: passwordForm.password,
        newPassword: passwordForm.newPassword,
      });
      if (res.data.success) {
        setSuccess(lang === 'hi' ? 'पासवर्ड सफलतापूर्वक बदल दिया गया!' : 'Password changed successfully!');
        setPasswordForm({ password: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || (lang === 'hi' ? 'पासवर्ड बदलने में विफल' : 'Failed to change password'));
    }
    setSaving(false);
  };



  return (
    <div style={styles.layout}>
      <HeaderNavbar />

      <div style={styles.container}>
          <div style={styles.pageHead}>
            <h1 style={styles.pageTitle}>{T('My Profile')}</h1>
            <p style={styles.pageSub}>{T('Manage your account information and security settings')}</p>
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Profile Information */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>{T('Personal Information')}</h2>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>{T('Name')}</label>
                <input type="text" name="name" value={form.name} disabled style={{ ...styles.input, background: '#F0F4FB', color: '#9EB3CC' }} />
                <div style={styles.hint}>{T('Name cannot be changed')}</div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>{T('Email')}</label>
                <input type="email" name="email" value={form.email} disabled style={{ ...styles.input, background: '#F0F4FB', color: '#9EB3CC' }} />
                <div style={styles.hint}>{T('Email cannot be changed')}</div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>{T('Phone Number')} *</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleInputChange} placeholder={T('Enter phone number')} style={styles.input} />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>{T('Department')} *</label>
                <input type="text" name="department" value={form.department} onChange={handleInputChange} placeholder={T('Enter your department')} style={styles.input} />
              </div>

              <button onClick={handleSaveProfile} disabled={saving} style={{ ...styles.btnPrimary, opacity: saving ? 0.6 : 1 }}>
                {saving ? T('Saving...') : T('Save Changes')}
              </button>
            </div>

            {/* Security */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>{T('Security')}</h2>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>{T('Current Password')} *</label>
                <input type="password" name="password" value={passwordForm.password} onChange={handlePasswordChange} placeholder={T('Enter current password')} style={styles.input} />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>{T('New Password')} *</label>
                <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} placeholder={T('Enter new password')} style={styles.input} />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>{T('Confirm New Password')} *</label>
                <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} placeholder={T('Confirm new password')} style={styles.input} />
              </div>

              <button onClick={handlePasswordChange_submit} disabled={saving} style={{ ...styles.btnPrimary, opacity: saving ? 0.6 : 1 }}>
                {saving ? T('Updating...') : T('Change Password')}
              </button>
            </div>
          </div>
        </div>
    </div>
  );
}

const styles = {
  layout: { background: '#F4F6FB', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" },
  container: { maxWidth: 1100, margin: '0 auto', padding: '40px', width: '100%', boxSizing: 'border-box' },
  pageHead: { marginBottom: 28 },
  pageTitle: { fontFamily: "'Noto Serif', serif", fontSize: 26, fontWeight: 700, color: '#0F2557', marginBottom: 6 },
  pageSub: { color: '#6B7FA3', fontSize: 14 },
  card: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 12px rgba(15,37,87,0.06)' },
  cardTitle: { fontSize: 16, fontWeight: 700, color: '#0F2557', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #F0F4FB' },
  formGroup: { marginBottom: 18 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#0F2557', marginBottom: 8 },
  input: { width: '100%', padding: '11px 14px', border: '1.5px solid #D8E2F0', borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' },
  hint: { fontSize: 12, color: '#9EB3CC', marginTop: 4 },
  btnPrimary: { width: '100%', padding: '12px', background: '#E8620A', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  error: { background: '#FEE2E2', color: '#C62828', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 600 },
  success: { background: '#DCFCE7', color: '#16A34A', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 600 },
};
