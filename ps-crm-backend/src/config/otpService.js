// ps-crm-backend/src/config/otpService.js

const crypto = require('crypto');

// In-memory store: { email: { otp, expiresAt, attempts } }
const otpStore = {};

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS       = 5;

function generateOTP() {
  return String(crypto.randomInt(100000, 999999));
}

function storeOTP(email) {
  const otp       = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  otpStore[email.toLowerCase()] = { otp, expiresAt, attempts: 0 };
  return otp;
}

function verifyOTP(email, inputOtp) {
  const key    = email.toLowerCase();
  const record = otpStore[key];

  if (!record)
    return { valid: false, reason: 'No OTP found for this email. Please request a new one.' };

  if (new Date() > new Date(record.expiresAt)) {
    delete otpStore[key];
    return { valid: false, reason: 'OTP has expired. Please request a new one.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    delete otpStore[key];
    return { valid: false, reason: 'Too many incorrect attempts. Please request a new OTP.' };
  }

  if (record.otp !== String(inputOtp).trim()) {
    otpStore[key].attempts += 1;
    const remaining = MAX_ATTEMPTS - otpStore[key].attempts;
    return { valid: false, reason: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` };
  }

  delete otpStore[key];
  return { valid: true };
}

function clearOTP(email) {
  delete otpStore[email.toLowerCase()];
}

// Auto-cleanup expired OTPs every 15 min
setInterval(() => {
  const now = new Date();
  for (const email of Object.keys(otpStore)) {
    if (now > new Date(otpStore[email].expiresAt)) delete otpStore[email];
  }
}, 15 * 60 * 1000);

module.exports = { storeOTP, verifyOTP, clearOTP };