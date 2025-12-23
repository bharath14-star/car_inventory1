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

// Configure CORS to allow the frontend origin set in env, otherwise allow all origins for now.
// In production set FRONTEND_URL to your deployed frontend (e.g. https://your-frontend.example)
const frontendOrigin = process.env.FRONTEND_URL || '*';
app.use(cors({ origin: frontendOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static uploads
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api', carRoutes);

// basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error', error: err.message });
});

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB Atlas connected');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('MongoDB Atlas connection error:', err);
  process.exit(1);
});  
