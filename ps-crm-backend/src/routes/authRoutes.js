// ps-crm-backend/src/routes/authRoutes.js
// CHANGES: 3 new OTP routes added at the top. All existing routes unchanged.

const express = require('express');
const router  = express.Router();
const {
  sendOTPHandler,          // ← NEW
  verifyOTPAndRegister,    // ← NEW
  resendOTP,               // ← NEW
  login,
  getOfficers,
  getPendingOfficers,
  approveOfficer,
  rejectOfficer,
  assignRole,
  updateProfile,
} = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ── OTP-based registration (new 2-step flow) ──────────────────────────────────
router.post('/send-otp',                sendOTPHandler);
router.post('/verify-otp-and-register', verifyOTPAndRegister);
router.post('/resend-otp',              resendOTP);

// ── All existing routes — unchanged ──────────────────────────────────────────
router.post('/login',                                   login);
router.get('/officers',          protect, adminOnly,    getOfficers);
router.get('/officers/pending',  protect, adminOnly,    getPendingOfficers);
router.put('/officers/:id/approve', protect, adminOnly, approveOfficer);
router.put('/officers/:id/reject',  protect, adminOnly, rejectOfficer);
router.put('/assign-role',       protect, adminOnly,    assignRole);
router.put('/profile/:userId',   protect,               updateProfile);

module.exports = router;