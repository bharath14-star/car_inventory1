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
    required: true
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});


// ✅ TTL index (MongoDB will auto-delete expired OTPs)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


// ✅ Prevent multiple active OTPs for same email + purpose
otpSchema.index(
  { email: 1, purpose: 1, isVerified: 1 },
  {
    unique: true,
    partialFilterExpression: { isVerified: false }
  }
);


// ✅ Cleanup old OTPs before saving new one
otpSchema.pre('save', async function(next) {
  if (this.isNew) {
    await mongoose.model('Otp').deleteMany({
      email: this.email,
      purpose: this.purpose,
      isVerified: false
    });
  }
  next();
});

module.exports = mongoose.model('Otp', otpSchema);
