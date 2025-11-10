# TODO: Implement Forgot Password Feature

- [x] Edit `backend/controllers/authController.js` to change JWT token expiry from '1h' to '60s' in forgotPassword function.
- [x] Edit `backend/utils/email.js` to change email sender from `process.env.EMAIL_USER` to `"CarPortal Support" <noreply@carportal.com>"` in sendEmail function.
- [x] Verify the changes and ensure environment variables are set (EMAIL_USER, EMAIL_PASS, FRONTEND_URL).
- [x] Test the APIs in Postman.
- [x] Explain frontend integration and API calls.
- [ ] Configure Gmail credentials in .env file.
- [ ] Test successful email sending.
- [ ] Test token verification and password reset.
- [ ] Test error scenarios (expired token, invalid token, etc.).
