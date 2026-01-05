# Carzs-02 Project Documentation

## 1. Project Overview
**Carzs-02** is a vehicle inventory management system. It consists of a Node.js/Express backend that handles data persistence, user authentication, and file management, and a frontend (likely React-based) for user interaction.

The system allows users to manage car entries, track "In/Out" status, upload media (photos/videos), and view dashboard statistics. It includes role-based access control (User vs. Admin).

## 2. Backend Architecture

### Technology Stack
- **Runtime:** Node.js
- **Framework:** Express.js (implied by controller structure)
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs
- **File Handling:** Multer (for uploads), ExcelJS (for reports)

### Database Models

#### 1. User (`models/User.js`)
Represents an authenticated user of the system.
- **Key Fields:** `firstName`, `lastName`, `email` (unique), `phone`, `password` (hashed), `role` ('user' or 'admin').
- **Usage:** Used for login and access control.

#### 2. Car (`models/Car.js`)
The primary entity representing a vehicle.
- **Key Fields:** 
  - `regNo`: Registration number (Indexed, Text Search).
  - `make`, `model`, `variant`, `year`, `colour`.
  - `inOutStatus`: Tracks if car is 'IN' or 'OUT'.
  - `media`: `photos` (Array of paths) and `video` (Single path).
  - `referralId`: Required field for tracking referrals.
  - `createdBy`: Reference to the User who added the car.
- **Indexes:** Optimized for searching by Registration Number, Person Name, Make/Model, and Date.

#### 3. PendingUser (`models/PendingUser.js`)
Likely used for an approval workflow or temporary registration.
- **Key Fields:** Similar to User but includes `employeeId`, `otp`, and `otpExpires`.

---

## 3. API Controllers & Features

### Authentication (`controllers/authController.js`)
| Feature | Description |
| :--- | :--- |
| **Register** | Creates a new user account. Validates that passwords match and email is unique. |
| **Login** | Authenticates user via email/password. Checks if the user's role matches the requested `loginType`. Returns a JWT. |
| **Forgot Password** | Generates a reset token and sends an email with a reset link (valid for 1 hour). |
| **Reset Password** | Verifies the token and updates the user's password. |
| **Verify** | Endpoint to validate the current JWT and return user details. |

### Car Inventory (`controllers/carController.js`)
| Feature | Description |
| :--- | :--- |
| **Create Car** | Accepts form data and file uploads (photos/video). Links the car to the creating user. |
| **Get All Cars** | Advanced retrieval with: <br>- **Pagination** (`page`, `limit`)<br>- **Sorting** (`sortBy`, `sortDir`)<br>- **Filtering** (RegNo, Make, Model, Status, Date Range)<br>- **Text Search** (Global search across multiple fields) |
| **Get Single Car** | Retrieves detailed information for a specific car ID. |
| **Update Car** | Updates car details. Handles file cleanup: if new photos/video are uploaded, old files are deleted from the server. |
| **Delete Car** | Permanently removes the car record and deletes associated files from the disk. |
| **Export** | **(Admin Only)** Generates an Excel (`.xlsx`) file containing the entire car inventory. |

### Dashboard Statistics (`controllers/carController.js -> getStats`)
Provides real-time metrics for the dashboard:
- **Counts:** Total cars, Today's entries, This Week's entries.
- **Lists:** 10 most recent entries.
- **Top Charts:** Top 5 Registration Numbers and Top 5 Person Names by volume.
- **Graph Data:** Daily entry counts for the last 7 days.

---

## 4. Setup & Configuration

### Prerequisites
- Node.js installed
- MongoDB instance running

### Environment Variables
The application relies on `process.env` variables. Ensure these are set (e.g., in a `.env` file):

```env
# Server Configuration
PORT=5000
UPLOAD_DIR=uploads

# Database
MONGODB_URI=mongodb://localhost:27017/your_db_name

# Security
JWT_SECRET=your_secure_jwt_secret

# Frontend Integration
FRONTEND_URL=http://localhost:5174/car_inventory

# Email Service (For Password Reset)
SMTP_HOST=smtp.example.com
SMTP_USER=user@example.com
SMTP_PASS=password
```

### Directory Structure
```
backend/
├── controllers/   # Business logic (Auth, Cars)
├── models/        # Mongoose Schemas (User, Car, PendingUser)
├── utils/         # Helper functions (e.g., email.js)
└── uploads/       # Directory where images/videos are stored
```
