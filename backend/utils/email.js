const nodemailer = require('nodemailer');

// Create transporter for Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  }
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error.message);
    console.log('GMAIL_USER exists:', !!process.env.GMAIL_USER);
    console.log('GMAIL_APP_PASSWORD exists:', !!process.env.GMAIL_APP_PASSWORD);
    console.log('GMAIL_SENDER_EMAIL:', process.env.GMAIL_SENDER_EMAIL);
    console.log('⚠️  Check your .env file and make sure you have set GMAIL_USER, GMAIL_APP_PASSWORD, GMAIL_SENDER_EMAIL, and GMAIL_SENDER_NAME');
  } else {
    console.log('✅ Email server is ready to send messages');
    console.log('📧 Configured sender:', process.env.GMAIL_SENDER_EMAIL);
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    console.log('📤 Attempting to send email...');
    console.log('   To:', to);
    console.log('   Subject:', subject);

    const mailOptions = {
      from: `"${process.env.GMAIL_SENDER_NAME}" <${process.env.GMAIL_SENDER_EMAIL}>`,
      to,
      subject,
      text,
      html,
      // Add envelope information for better debugging
      envelope: {
        from: process.env.GMAIL_SENDER_EMAIL,
        to: to
      }
    };
    try{
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully!');
      console.log('   Message ID:', info.messageId);
      console.log('   Response:', info.response);
      console.log('   Envelope From:', info.envelope.from);
      console.log('   Envelope To:', info.envelope.to);
      console.log('   Accepted recipients:', info.accepted);
      console.log('   Rejected recipients:', info.rejected);
    } catch (err) {
    console.error("SMTP ERROR:", err);
    }  

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