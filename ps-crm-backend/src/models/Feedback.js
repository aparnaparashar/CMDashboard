const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
    },
    citizenName:  { type: String, required: true },
    citizenEmail: { type: String, required: true },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment:   { type: String },
    aspects:   [{ type: String }],
    sentiment: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative'],
      default: 'Neutral',
    },
  },
  { timestamps: true }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
// test123