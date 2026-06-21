const express = require('express');
const router = express.Router();
const { submitFeedback, getAllFeedback, getComplaintFeedback } = require('../controllers/feedbackController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const Feedback = require('../models/Feedback'); // added

// Public - citizens submit feedback
router.post('/', protect, submitFeedback);

// NEW - get feedback for a specific complaint (must be before /:complaintId)
router.get('/complaint/:complaintId', protect, async (req, res) => {
  try {
    const fb = await Feedback.findOne({ complaint: req.params.complaintId });
    res.json({ success: true, data: fb || null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin only - view all feedback
router.get('/', protect, adminOnly, getAllFeedback);

// Get feedback for specific complaint (existing)
router.get('/:complaintId', protect, getComplaintFeedback);

// NEW - update feedback
router.put('/:id', protect, async (req, res) => {
  try {
    const { rating, comment, aspects } = req.body;

    const fb = await Feedback.findByIdAndUpdate(
      req.params.id,
      { rating, comment, aspects },
      { new: true }
    );

    res.json({ success: true, data: fb });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;