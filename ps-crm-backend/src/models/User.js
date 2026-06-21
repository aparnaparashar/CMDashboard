const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['citizen', 'officer', 'admin', 'cm', 'supervisor'],
      default: 'citizen',
    },
    phone:      { type: String },
    area:       { type: String },
    ward:       { type: String },
    department: { type: String },  // for officers
    activeComplaints: {
      type: Number,
      default: 0,
    },
    totalAssigned: {
      type: Number,
      default: 0,
    },
    completionRate: {
      type: Number,
      default: 0,
    },
    customerRating: {
      type: Number,
      default: 0,
    },
    avgResolutionTime: {
      type: Number,
      default: 0,
    },
    lastActive: {
      type: Date,
      default: null,
    },
    recentActivity: [
      {
        timestamp: { type: Date },
        description: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'pending', 'rejected'],
      default: 'active',           // citizens are always active immediately
    },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;