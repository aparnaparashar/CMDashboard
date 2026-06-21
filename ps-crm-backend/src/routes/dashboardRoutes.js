const express = require('express');
const router = express.Router();
const { getDashboardStats, getPublicStats } = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/public', getPublicStats);                    // ✅ ADDED — no auth, used by Home.js
router.get('/', protect, adminOnly, getDashboardStats);   // admin only

module.exports = router;