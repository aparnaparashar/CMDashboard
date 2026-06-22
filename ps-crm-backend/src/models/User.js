const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['citizen', 'officer', 'admin'],
      default: 'citizen',
    },
    phone:      { type: String },
    ward:       { type: String },
    department: { type: String },  // for officers
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