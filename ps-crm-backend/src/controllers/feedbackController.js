const Feedback = require('../models/Feedback');
const Complaint = require('../models/Complaint');

// Simple sentiment analysis based on rating and keywords
const analyzeSentiment = (rating, comment) => {
  if (rating >= 4) return 'Positive';
  if (rating === 3) return 'Neutral';
  if (rating <= 2) return 'Negative';

  if (comment) {
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'fast', 'helpful'];
    const negativeWords = ['bad', 'poor', 'slow', 'unhappy', 'terrible', 'worst', 'useless'];

    const lowerComment = comment.toLowerCase();
    const hasPositive = positiveWords.some(word => lowerComment.includes(word));
    const hasNegative = negativeWords.some(word => lowerComment.includes(word));

    if (hasPositive && !hasNegative) return 'Positive';
    if (hasNegative && !hasPositive) return 'Negative';
  }

  return 'Neutral';
};

// Submit feedback
const submitFeedback = async (req, res) => {
  try {
    const { complaintId, rating, comment, aspects } = req.body;

    // Get citizen info from the logged-in user (JWT)
   const citizenEmail = req.user.email;
   const citizenName  = req.user.name;

    // Check complaint exists and is resolved
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }
    if (complaint.status !== 'Resolved') {
      return res.status(400).json({ success: false, message: 'Can only give feedback on resolved complaints' });
    }

    // Check if feedback already submitted
    const existing = await Feedback.findOne({ complaint: complaintId, citizenEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Feedback already submitted for this complaint' });
    }

    const sentiment = analyzeSentiment(rating, comment);

    const feedback = await Feedback.create({
      complaint: complaintId,
      citizenName,
      citizenEmail,
      rating,
      comment,
      aspects,
      sentiment,
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all feedback (admin)
const getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate('complaint', 'title category status')
      .sort({ createdAt: -1 });

    // Calculate average rating
    const totalRatings = feedback.length;
    const avgRating = totalRatings
      ? (feedback.reduce((sum, f) => sum + f.rating, 0) / totalRatings).toFixed(1)
      : 0;

    // Sentiment breakdown
    const positive = feedback.filter(f => f.sentiment === 'Positive').length;
    const neutral  = feedback.filter(f => f.sentiment === 'Neutral').length;
    const negative = feedback.filter(f => f.sentiment === 'Negative').length;

    res.status(200).json({
      success: true,
      data: {
        summary: { totalRatings, avgRating, positive, neutral, negative },
        feedback,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get feedback for a specific complaint
const getComplaintFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ complaint: req.params.complaintId });
    res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitFeedback, getAllFeedback, getComplaintFeedback };