const express = require('express');
const router = express.Router();

/* ================= CONTROLLERS ================= */
const {
  register,
  verifyOtp,
  userLogin,
  adminLogin,
  forgotPassword,
  resetPassword,
  verify,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/authController');

/* ================= MIDDLEWARE ================= */
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

/* ================= AUTH ROUTES ================= */
router.post('/register', register);
router.post('/verify-otp', verifyOtp);

/* ✅ ROLE-BASED LOGIN */
router.post('/login', userLogin);          // USER LOGIN
router.post('/admin/login', adminLogin);   // ADMIN LOGIN

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify', authMiddleware, verify);

/* ================= ADMIN USER MANAGEMENT ================= */
router.get('/users', authMiddleware, adminMiddleware, getAllUsers);
router.get('/users/:id', authMiddleware, adminMiddleware, getUserById);
router.put('/users/:id', authMiddleware, adminMiddleware, updateUser);
router.delete('/users/:id', authMiddleware, adminMiddleware, deleteUser);

module.exports = router;
