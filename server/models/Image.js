const mongoose = require('mongoose');

const boundingBoxSchema = new mongoose.Schema({
  x: Number,
  y: Number,
  width: Number,
  height: Number,
  label: String
});

const imageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  path: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  boundingBoxes: [boundingBoxSchema],
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Image', imageSchema); 