const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },

    lastName: {
      type: String,
      required: true,
      trim: true
    },

    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },

    phone: {
      type: String,
      required: true
    },

    password: {
      type: String,
      required: true,
      select: false // ✅ NEVER return password by default
    },

    employeeId: {
      type: String,
      required: true,
      maxlength: 16
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      immutable: true // ✅ cannot be changed accidentally
    },

    isVerified: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
