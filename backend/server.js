const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const violationRoutes = require('./routes/violationRoutes');
const snapshotRoutes = require('./routes/snapshotRoutes');
const playgroundRoutes = require('./routes/playgroundRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to MongoDB using Native Driver
connectDB().then(() => {
  console.log('App database connection established');
}).catch(err => {
  console.error('Failed to initialize database:', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/snapshots', snapshotRoutes);
app.use('/api/playground', playgroundRoutes);

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.use((req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ message: 'API route not found' });
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
