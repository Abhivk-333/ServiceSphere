const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private (Customers only)
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can book services' });
    }

    const { providerId, serviceId, appointmentDate, appointmentTime, totalAmount } = req.body;

    const booking = await Booking.create({
      customerId: req.user.id,
      providerId,
      serviceId,
      appointmentDate,
      appointmentTime,
      totalAmount,
      tracking: [{ status: 'pending', timestamp: Date.now() }]
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings/my-bookings
// @desc    Get user's bookings (Customer or Provider)
// @access  Private
router.get('/my-bookings', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'customer') {
      query = { customerId: req.user.id };
    } else if (req.user.role === 'provider') {
      query = { providerId: req.user.id };
    }

    const bookings = await Booking.find(query)
      .populate('customerId', 'firstName lastName phone')
      .populate('providerId', 'firstName lastName phone')
      .populate('serviceId', 'title category price');
      
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get a single booking by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'firstName lastName phone profilePic')
      .populate('providerId', 'firstName lastName phone profilePic category city rating')
      .populate('serviceId', 'title category price duration description');
      
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Only allow participants to view
    if (booking.customerId._id.toString() !== req.user.id && booking.providerId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'accepted', 'started_travel', 'arrived', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only allow participants to update
    if (booking.customerId.toString() !== req.user.id && booking.providerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    booking.status = status;
    booking.tracking.push({ status, timestamp: Date.now() });

    await booking.save();
    
    // TODO: If status is 'completed', update provider earnings in User model

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
