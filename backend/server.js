require('dotenv').config({ encoding: 'utf8' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const { MONGO_URI } = require('./controllers/config/Database');

const authRoutes = require('./routes/authRoutes');
const carRoutes = require('./routes/carRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

/* ================= CORS FIX (VERY IMPORTANT) ================= */
app.use(cors({
  origin: process.env.FRONTEND_URL, // exact frontend URL
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= STATIC UPLOADS FIX ================= */
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'))
);

/* ================= ROUTES ================= */
app.use('/api/auth', authRoutes);
app.use('/api', carRoutes);

/* ================= ERROR HANDLER ================= */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    message: 'Server error',
    error: err.message,
  });
});

/* ================= DB + SERVER ================= */
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Atlas connected');
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error('MongoDB Atlas connection error:', err);
    process.exit(1);
  });
