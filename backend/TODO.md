# TODO: Switch OTP Email Sending to Brevo

## Tasks
- [x] Update `backend/utils/email.js` to use Brevo SMTP instead of Gmail SMTP
  - Change transporter host to `smtp-relay.brevo.com`
  - Set port to 587
  - Use BREVO_API_KEY for both username and password
  - Update 'from' field to use BREVO_SENDER_NAME and BREVO_SENDER_EMAIL
  - Remove BCC to admin email
- [ ] Test email functionality by running server and attempting user registration

## Status
- Plan approved by user
- Implementation completed
- Ready for testing
