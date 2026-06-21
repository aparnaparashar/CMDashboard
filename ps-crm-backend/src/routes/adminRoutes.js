const express = require('express');
const router = express.Router();
const {
  getNearbyComplaints,
  reverseLocation,
  getVisitLogs,
  getCmMobileStats,
  getHeatmap,
  getOfficersBandwidth,
} = require('../controllers/adminController');
const { protect, adminOrSupervisor } = require('../middleware/authMiddleware');
const {
  validateNearbyParams,
  validateCoordinatesParams,
  validateCmIdFilterParams,
  validateCmIdParams,
  validateOfficersBandwidthParams,
} = require('../middleware/validateParams');

router.get('/complaints/nearby', protect, adminOrSupervisor, validateNearbyParams, getNearbyComplaints);
router.get('/location/reverse', protect, adminOrSupervisor, validateCoordinatesParams, reverseLocation);
router.get('/visit-logs', protect, adminOrSupervisor, validateCmIdFilterParams, getVisitLogs);
router.get('/cm-mobile-stats', protect, adminOrSupervisor, validateCmIdParams, getCmMobileStats);
router.get('/heatmap', protect, adminOrSupervisor, validateCmIdParams, getHeatmap);
router.get('/officers-bandwidth', protect, adminOrSupervisor, validateOfficersBandwidthParams, getOfficersBandwidth);

module.exports = router;
