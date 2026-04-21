const Snapshot = require('../models/Snapshot');
const Violation = require('../models/Violation');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const saveSnapshot = async (req, res) => {
  try {
    const { examId, image, triggerReason } = req.body;
    if (!examId || !image) {
      return res.status(400).json({ message: 'Missing examId or image data' });
    }

    if (!req.user || !req.user._id) {
       return res.status(401).json({ message: 'User not authenticated' });
    }

    // image is expected to be a base64 string: data:image/png;base64,iVBORw0KGgo...
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Save locally
    const filename = `snapshot_${req.user._id}_${Date.now()}.png`;
    const uploadsDir = path.join(__dirname, '../../frontend/uploads/snapshots');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);
    
    const imageUrl = `/uploads/snapshots/${filename}`;
    
    const snapshot = await Snapshot.create({
      examId,
      studentId: req.user._id,
      imageUrl,
      triggerReason: triggerReason || 'PERIODIC'
    });

    // Run AI Analysis via Web Service
    runAIAnalysis(buffer, filename, examId, req.user._id);
    
    res.status(201).json(snapshot);
  } catch (error) {
    console.error('Error saving snapshot:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getSnapshots = async (req, res) => {
  try {
    const snapshots = await Snapshot.find()
      .populate('studentId', 'name roll_number email')
      .populate('examId', 'title')
      .sort({ timestamp: -1 });
    res.json(snapshots);
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const runAIAnalysis = async (buffer, filename, examId, studentId) => {
  try {
    const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:10000';
    
    const form = new FormData();
    form.append('file', buffer, { filename });

    const response = await axios.post(`${aiEngineUrl}/analyze`, form, {
      headers: {
        ...form.getHeaders()
      }
    });

    const results = response.data;

    if (results.violations && results.violations.length > 0) {
      for (const vType of results.violations) {
        await Violation.create({
          studentId,
          examId,
          violationType: vType,
          timestamp: new Date()
        });
      }
    }
  } catch (error) {
    console.error('AI Processing Error (Web Service):', error.message);
  }
};

module.exports = { saveSnapshot, getSnapshots };
