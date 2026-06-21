const mongoose = require('mongoose');

const visitLogSchema = new mongoose.Schema(
  {
    cmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    visitDate: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
    outcome: {
      type: String,
      default: '',
    },
    complaintsHandled: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint',
      },
    ],
    areaSummary: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const VisitLog = mongoose.model('VisitLog', visitLogSchema);
module.exports = VisitLog;
