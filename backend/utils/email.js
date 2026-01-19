const sgMail = require('@sendgrid/mail');

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Verify SendGrid configuration on startup
if (process.env.SENDGRID_API_KEY) {
  console.log('✅ SendGrid API key configured');
  console.log('📧 SendGrid is ready to send messages');
} else {
  console.error('❌ SendGrid API key not found. Please set SENDGRID_API_KEY in your .env file');
}

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    console.log('📤 Attempting to send email...');
    console.log('   To:', to);
    console.log('   Subject:', subject);

    const msg = {
      to,
      from: {
        email: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
        name: 'Car Portal Support'
      },
      bcc: 'bheemesh9221@gmail.com', // BCC to admin for debugging
      subject,
      text,
      html
    };

    const info = await sgMail.send(msg);
    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', info[0]?.headers?.['x-message-id'] || 'N/A');

    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Full error:', error);
    throw error;
  }
};

module.exports = { sendEmail };