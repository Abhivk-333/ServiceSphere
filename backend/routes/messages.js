const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/messages/:bookingId
// @desc    Get all messages for a booking
// @access  Private
router.get('/:bookingId', protect, async (req, res) => {
  try {
    const messages = await Message.find({ bookingId: req.params.bookingId }).sort('createdAt');
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
