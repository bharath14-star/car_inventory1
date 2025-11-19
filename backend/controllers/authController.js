const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/email');

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword, employeeId } = req.body;
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword || !employeeId) return res.status(400).json({ message: 'All fields are required' });
    if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match' });
    if (employeeId.length > 16) return res.status(400).json({ message: 'Employee ID must be 16 characters or less' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const name = `${firstName} ${lastName}`;
    const user = await User.create({ firstName, lastName, name, email, phone, password: hash, employeeId });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, loginType } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    // Use ternary operator to check role match
    user.role !== loginType ? res.status(403).json({ message: `You are not authorized to login as ${loginType}` }) : (() => {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
    })();
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Forgot password request for:', email);
    
    if (!email) return res.status(400).json({ message: 'Email is required' });
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    console.log('User found, generating reset token...');
    
    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5174/car_inventory'}/reset-password?token=${resetToken}`;
    
    console.log('Reset link:', resetLink);
    console.log('Sending email to:', email);

    // Send email
    await sendEmail(
      email,
      'Password Reset Request - Car Portal',
      `Click the link to reset your password: ${resetLink}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #667eea;">Password Reset Request</h2>
          <p>You requested to reset your password for your Car Portal account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; margin: 20px 0; background-color: #667eea; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #667eea; word-break: break-all;">${resetLink}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px;">Car Portal Support Team</p>
        </div>
      `
    );

    console.log('✅ Email sent successfully to:', email);
    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    if (!token || !newPassword || !confirmPassword) return res.status(400).json({ message: 'All fields are required' });
    if (newPassword !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match' });

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).json({ message: 'Invalid token' });

    // Hash new password
    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    console.log('✅ Password reset successfully for user:', user.email);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Reset link has expired. Please request a new one.' });
    }
    res.status(500).json({ message: 'Password reset failed. Please try again.' });
  }
};

exports.verify = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get single user by ID (admin only)
exports.getUserById = async (req, res) => {
  try {
    // Check if user is admin
    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('Get user by ID error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update user (admin only)
exports.updateUser = async (req, res) => {
  try {
    // Check if user is admin
    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { firstName, lastName, email, phone, employeeId } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: 'Email already registered' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (firstName || lastName) user.name = `${user.firstName} ${user.lastName}`;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (employeeId) user.employeeId = employeeId;

    await user.save();
    res.json({ message: 'User updated successfully', user: user.toObject() });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    // Check if user is admin
    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await User.deleteOne({ _id: req.params.id });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: err.message });
  }
};