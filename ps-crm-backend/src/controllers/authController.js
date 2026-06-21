// ps-crm-backend/src/controllers/authController.js
// CHANGES: register() split into sendOTP + verifyOTPAndRegister + resendOTP
// Everything else (login, getOfficers, getPendingOfficers, approveOfficer,
// rejectOfficer, assignRole, updateProfile) is IDENTICAL to your original.

const User       = require('../models/User');
const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');
const Complaint  = require('../models/Complaint');
const { sendOfficerPendingEmail, sendOfficerApprovalEmail, sendOfficerRejectionEmail, sendOTPEmail } = require('../config/emailService');
const { storeOTP, verifyOTP, clearOTP } = require('../config/otpService');

// Generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/send-otp  ← NEW (replaces the first half of register)
// Validates form fields, checks email not taken, sends OTP
// ─────────────────────────────────────────────────────────────────────────────
const sendOTPHandler = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    // Block admin self-registration (same guard as original register)
    if (role === 'admin')
      return res.status(403).json({ success: false, message: 'Admin accounts cannot be self-registered. Contact the system administrator.' });

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ success: false, message: 'Email already registered' });

    // Generate OTP, store it, send email
    const otp = storeOTP(email);
    console.log(`[Auth] OTP generated for ${email}: ${otp}`);
    
    try {
      await sendOTPEmail(email, otp, name);
      console.log(`[Auth] OTP sent successfully to ${email}`);
    } catch (emailError) {
      console.error(`[Auth] Failed to send OTP email to ${email}:`, emailError.message);
      throw new Error(`Email sending failed: ${emailError.message}`);
    }

    res.json({ success: true, message: 'OTP sent successfully. Please check your email.' });
  } catch (error) {
    console.error('[Auth] sendOTP error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Failed to send OTP: ${error.message}` });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp-and-register  ← NEW (replaces the second half of register)
// Verifies OTP then creates the user — exactly same logic as original register
// ─────────────────────────────────────────────────────────────────────────────
const verifyOTPAndRegister = async (req, res) => {
  try {
    const { name, email, password, role, phone, ward, department, otp } = req.body;

    if (!otp)
      return res.status(400).json({ success: false, message: 'OTP is required.' });

    // Verify OTP first
    const result = verifyOTP(email, otp);
    if (!result.valid)
      return res.status(400).json({ success: false, message: result.reason });

    // Race condition guard
    const userExists = await User.findOne({ email });
    if (userExists) {
      clearOTP(email);
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // ── From here: identical to your original register() ──────────────────
    const salt           = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const status         = role === 'officer' ? 'pending' : 'active';

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role:     role === 'officer' ? 'officer' : 'citizen',
      phone,
      ward,
      department: role === 'officer' ? department : undefined,
      status,
    });

    // Officer — pending approval flow (same as original)
    if (role === 'officer') {
      sendOfficerPendingEmail({ name, email, department });
      return res.status(201).json({
        success: true,
        pending: true,
        message: 'Registration submitted. Awaiting admin approval.',
      });
    }

    // Citizen — return token immediately (same as original)
    res.status(201).json({
      success: true,
      data: {
        _id:   user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        token: generateToken(user._id, user.role),
      },
    });
  } catch (error) {
    console.error('[Auth] verifyOTPAndRegister error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/resend-otp  ← NEW
// ─────────────────────────────────────────────────────────────────────────────
const resendOTP = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required.' });

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const otp = storeOTP(email); // overwrites previous OTP
    console.log(`[Auth] Resending OTP for ${email}: ${otp}`);
    
    try {
      await sendOTPEmail(email, otp, name);
      console.log(`[Auth] Resend OTP successfully sent to ${email}`);
    } catch (emailError) {
      console.error(`[Auth] Failed to resend OTP email to ${email}:`, emailError.message);
      throw new Error(`Email sending failed: ${emailError.message}`);
    }

    res.json({ success: true, message: 'A new OTP has been sent to your email.' });
  } catch (error) {
    console.error('[Auth] resendOTP error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Failed to resend OTP: ${error.message}` });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Everything below is YOUR ORIGINAL CODE — zero changes
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    if (user.status === 'pending')
      return res.status(403).json({ success: false, pending: true, message: 'Your account is awaiting admin approval. You will be notified by email once approved.' });

    if (user.status === 'rejected')
      return res.status(403).json({ success: false, rejected: true, message: `Your registration was rejected.${user.rejectionReason ? ' Reason: ' + user.rejectionReason : ' Please contact admin.'}` });

    res.status(200).json({
      success: true,
      data: {
        _id:   user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        token: generateToken(user._id, user.role),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/officers
const getOfficers = async (req, res) => {
  try {
    const officers = await User.find({ role: 'officer', status: 'active' }).select('-password');
    const enriched = await Promise.all(
      officers.map(async (o) => {
        const assignedCount = await Complaint.countDocuments({ assignedTo: o._id.toString() });
        const resolvedCount = await Complaint.countDocuments({ assignedTo: o._id.toString(), status: 'Resolved' });
        const pendingCount  = await Complaint.countDocuments({ assignedTo: o._id.toString(), status: 'Pending' });
        return { ...o.toObject(), assignedCount, resolvedCount, pendingCount };
      })
    );
    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/officers/pending
const getPendingOfficers = async (req, res) => {
  try {
    const officers = await User.find({ role: 'officer', status: 'pending' }).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: officers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/auth/officers/:id/approve
const approveOfficer = async (req, res) => {
  try {
    const officer = await User.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true }).select('-password');
    if (!officer)
      return res.status(404).json({ success: false, message: 'Officer not found' });
    sendOfficerApprovalEmail(officer);
    res.status(200).json({ success: true, message: 'Officer approved successfully', data: officer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/auth/officers/:id/reject
const rejectOfficer = async (req, res) => {
  try {
    const { reason } = req.body;
    const officer = await User.findById(req.params.id).select('-password');
    if (!officer)
      return res.status(404).json({ success: false, message: 'Officer not found' });
    await User.findByIdAndUpdate(req.params.id, { status: 'rejected', rejectionReason: reason || '' });
    sendOfficerRejectionEmail(officer, reason);
    res.status(200).json({ success: true, message: 'Officer rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/auth/assign-role
const assignRole = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!['citizen', 'officer', 'admin'].includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role. Must be citizen, officer, or admin.' });
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: 'No user found with that email address.' });
    user.role   = role;
    user.status = 'active';
    await user.save();
    res.status(200).json({ success: true, message: `Role updated to "${role}" for ${user.name} (${user.email})` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/auth/profile/:userId
const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { phone, ward, department, password, newPassword } = req.body;
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found.' });
    if (newPassword) {
      if (!password || !await user.matchPassword(password))
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      const salt  = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }
    if (phone)      user.phone      = phone;
    if (ward)       user.ward       = ward;
    if (department) user.department = department;
    await user.save();
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { _id: user._id, name: user.name, email: user.email, phone: user.phone, ward: user.ward, department: user.department, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  sendOTPHandler,
  verifyOTPAndRegister,
  resendOTP,
  login,
  getOfficers,
  getPendingOfficers,
  approveOfficer,
  rejectOfficer,
  assignRole,
  updateProfile,
};