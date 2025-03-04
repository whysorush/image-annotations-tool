const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const Image = require('../models/Image');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Upload image
router.post('/upload', auth, upload.array('images'), async (req, res) => {
  try {
    const uploadedImages = [];
    
    for (const file of req.files) {
      const image = new Image({
        userId: req.user.userId,
        path: `/uploads/${file.filename}`,
        filename: file.filename,
        boundingBoxes: []
      });
      
      await image.save();
      uploadedImages.push(image);
    }

    res.status(201).json(uploadedImages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's images
router.get('/', auth, async (req, res) => {
  try {
    const images = await Image.find({ userId: req.user.userId });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update bounding boxes for an image
router.put('/:imageId/boxes', auth, async (req, res) => {
  try {
    const { boundingBoxes } = req.body;
    const image = await Image.findOne({
      _id: req.params.imageId,
      userId: req.user.userId
    });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    image.boundingBoxes = boundingBoxes;
    await image.save();

    res.json(image);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an image
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Image.findByIdAndDelete(id);
    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting image' });
  }
});

module.exports = router; 