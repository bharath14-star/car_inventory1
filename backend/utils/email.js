const nodemailer = require("nodemailer");

// Use safer SMTP config for production (works on Render, Railway, VPS, etc.)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // IMPORTANT: false for 587
  auth: {
    user: process.env.EMAIL_USER,      // must match .env
    pass: process.env.EMAIL_APP_PASS,  // must be Gmail App Password
  },
});

// Verify connection on server start
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email configuration error:", error.message);
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_APP_PASS exists:", !!process.env.EMAIL_APP_PASS);
    console.log("⚠️ Make sure you're using Gmail App Password, not normal password");
  } else {
    console.log("✅ Email server is ready");
  }
});

// General email sender (you can still use this anywhere)
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Car Portal Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Email send failed:", error.message);
    return false;
  }
};

// Dedicated OTP sender (use this in authController)
const sendOtpEmail = async (email, otp) => {
  return sendEmail({
    to: email,
    subject: "OTP Verification",
    html: `
      <div style="font-family: Arial; padding: 10px">
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1 style="color: #2563eb">${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendOtpEmail };
