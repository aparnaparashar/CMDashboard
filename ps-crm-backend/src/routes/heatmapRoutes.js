// ps-crm-backend/src/routes/heatmapRoutes.js

const express = require('express');
const router  = express.Router();
const { getHeatmapData } = require('../controllers/heatmapController');

// Public route — visible to citizens and admins both
router.get('/data', getHeatmapData);

module.exports = router;