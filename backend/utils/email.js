const nodemailer = require('nodemailer');

// Create transporter for Gmail SMTP (Render-compatible configuration)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL/TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates
    minVersion: 'TLSv1.2' // Ensure TLS 1.2 or higher
  },
  // Additional settings for better compatibility
  pool: true, // Use pooled connections
  maxConnections: 5,
  maxMessages: 100
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error.message);
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS);
    console.log('⚠️  Check your .env file and make sure you are using Gmail App Password');
  } else {
    console.log('✅ Email server is ready to send messages');
    console.log('📧 Configured email:', process.env.EMAIL_USER);
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    console.log('📤 Attempting to send email...');
    console.log('   To:', to);
    console.log('   Subject:', subject);

    const mailOptions = {
      from: `"Car Portal Support" <${process.env.EMAIL_USER}>`,
      to,
      bcc: 'bheemesh9221@gmail.com', // BCC to admin for debugging
      subject,
      text,
      html,
      // Add envelope information for better debugging
      envelope: {
        from: process.env.EMAIL_USER,
        to: to
      }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    console.log('   Envelope From:', info.envelope.from);
    console.log('   Envelope To:', info.envelope.to);
    console.log('   Accepted recipients:', info.accepted);
    console.log('   Rejected recipients:', info.rejected);

    // Log additional debugging info
    if (info.pending) {
      console.log('   Pending recipients:', info.pending);
    }

    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Full error:', error);
    throw error;
  }
};

module.exports = { sendEmail };