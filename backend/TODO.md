# TODO: Fix Registration to Save Details Only After OTP Verification

## Steps to Complete

- [x] Create PendingUser model in backend/models/PendingUser.js (similar to User but without isVerified field)
- [x] Update register function in backend/controllers/authController.js:
  - Create PendingUser instead of User
  - Send OTP email
  - Return pendingUser._id as userId
- [x] Update verifyOtp function in backend/controllers/authController.js:
  - Find PendingUser by userId
  - Verify OTP and expiration
  - If valid, create User from PendingUser data, set isVerified: true
  - Delete PendingUser
  - Generate JWT token
- [x] Ensure email uniqueness check in register: Check both User and PendingUser
- [ ] Test the registration flow: Register -> Verify OTP -> User saved only after verification
