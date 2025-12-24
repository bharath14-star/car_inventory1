const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');

/* ================= REGISTER ================= */
exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      confirmPassword,
      employeeId
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword || !employeeId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (employeeId.length > 16) {
      return res.status(400).json({ message: 'Employee ID must be 16 characters or less' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const pendingExists = await PendingUser.findOne({ email });
    if (pendingExists && pendingExists.otpExpires > new Date()) {
      return res.status(400).json({ message: 'OTP already sent. Please verify.' });
    }

    if (pendingExists) {
      await PendingUser.deleteOne({ email });
    }

    const hash = await bcrypt.hash(password, 10);
    const name = `${firstName} ${lastName}`;

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const pendingUser = await PendingUser.create({
      firstName,
      lastName,
      name,
      email,
      phone,
      password: hash,
      employeeId,
      role: 'user', // ✅ DEFAULT ROLE
      otp,
      otpExpires
    });

    await sendEmail(
      email,
      'OTP Verification - Car Portal',
      `Your OTP is ${otp}`,
      `<h3>Your OTP is <b>${otp}</b>. It expires in 10 minutes.</h3>`
    );

    res.json({
      message: 'Registration successful. Please verify OTP.',
      userId: pendingUser._id
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ================= VERIFY OTP ================= */
exports.verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const pendingUser = await PendingUser.findById(userId);
    if (!pendingUser) {
      return res.status(404).json({ message: 'Invalid or expired OTP' });
    }

    if (pendingUser.otp !== otp || pendingUser.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await User.create({
      firstName: pendingUser.firstName,
      lastName: pendingUser.lastName,
      name: pendingUser.name,
      email: pendingUser.email,
      phone: pendingUser.phone,
      password: pendingUser.password,
      employeeId: pendingUser.employeeId,
      role: pendingUser.role || 'user',
      isVerified: true
    });

    await PendingUser.deleteOne({ _id: userId });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'OTP verified successfully',
      user,
      token
    });

  } catch (err) {
    console.error('OTP error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ================= USER LOGIN ================= */
exports.userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.role !== 'user') {
      return res.status(403).json({ message: 'Users only' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ user, token });

  } catch (err) {
    console.error('User login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ================= ADMIN LOGIN ================= */
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email });
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ admin, token });

  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ================= FORGOT PASSWORD ================= */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: 'If account exists, reset link sent' });
    }

    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail(
      email,
      'Password Reset - Car Portal',
      resetLink,
      `<a href="${resetLink}">Reset Password</a>`
    );

    res.json({ message: 'Password reset link sent' });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ================= RESET PASSWORD ================= */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password reset successful' });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(400).json({ message: 'Reset link expired or invalid' });
  }
};
