const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['registration', 'password_reset', 'email_verification'],
    default: 'registration'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index to auto-delete expired OTPs
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Max verification attempts
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate active OTPs for same email and purpose
otpSchema.index({ email: 1, purpose: 1, isVerified: 1 }, {
  unique: true,
  partialFilterExpression: { isVerified: false }
});

// Pre-save middleware to clean up expired OTPs
otpSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Clean up any existing unverified OTPs for this email and purpose
    await mongoose.model('Otp').deleteMany({
      email: this.email,
      purpose: this.purpose,
      isVerified: false
    });
  }
  next();
});

module.exports = mongoose.model('Otp', otpSchema);
