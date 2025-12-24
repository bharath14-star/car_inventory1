const express = require("express");
const router = express.Router();

const {
  register,
  verifyOtp,
  userLogin,
  adminLogin,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

/* ================= AUTH ROUTES ================= */

// Register & OTP
router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.get("/verify-otp", verifyOtp); // For email link verification

// Login (SEPARATE)
router.post("/login", userLogin);          // USERS ONLY
router.post("/admin/login", adminLogin);   // ADMINS ONLY

// Password reset
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
