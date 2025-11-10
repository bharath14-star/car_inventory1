const nodemailer = require('nodemailer');

// Create transporter for Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
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
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Full error:', error);
    throw error;
  }
};

module.exports = { sendEmail };