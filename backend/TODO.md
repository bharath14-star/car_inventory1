# TODO: Fix Email OTP Verification on Render

## Current Status
- Email OTP works on localhost but fails on Render deployment
- Issue identified: Gmail SMTP configuration incompatible with Render (port 587 blocked/restricted)

## Tasks
- [x] Update `today/backend/utils/email.js` to use port 465 with secure: true
- [x] Add improved TLS settings for production environments
- [x] Enhance error logging for better debugging on Render
- [ ] Deploy updated code to Render
- [ ] Set EMAIL_USER and EMAIL_PASS (Gmail App Password) in Render Environment Variables
- [ ] Test OTP registration on deployed app
- [ ] Verify OTP delivery, expiry, and resend functionality in production
- [ ] Check Render logs for email-related errors

## Notes
- Ensure Gmail App Password is used for EMAIL_PASS, not regular password
- Monitor transporter.verify logs on startup
- Test with actual email sending to confirm functionality
