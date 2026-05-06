const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/users/providers
// @desc    Get all verified providers
// @access  Public
router.get('/providers', async (req, res) => {
  try {
    const providers = await User.find({ role: 'provider', verified: true }).select('-password');
    res.json(providers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/providers/:id
// @desc    Get a single provider by ID
// @access  Public
router.get('/providers/:id', async (req, res) => {
  try {
    const provider = await User.findById(req.params.id).select('-password');
    if (!provider || provider.role !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }
    res.json(provider);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { firstName, lastName, phone, location, category, experience, bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, phone, location, category, experience, bio },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/earnings
// @desc    Calculate and get provider earnings
// @access  Private (Providers only)
router.get('/earnings', protect, async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Find all completed bookings for this provider
    const completedBookings = await Booking.find({ 
      providerId: req.user.id,
      status: 'completed'
    });

    // Calculate total earnings
    const totalEarnings = completedBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    
    // Update the provider's earnings field
    await User.findByIdAndUpdate(req.user.id, { earnings: totalEarnings });

    res.json({
      totalEarnings,
      completedJobs: completedBookings.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/unverified-providers
// @desc    Get all unverified providers
// @access  Private (Admin only)
router.get('/unverified-providers', protect, async (req, res) => {
  console.log('GET /api/users/unverified-providers hit by user:', req.user.id);
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized, admin only' });
    }
    const unverified = await User.find({ role: 'provider', verified: false }).select('-password');
    res.json(unverified);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});



// @route   PUT /api/users/verify/:id
// @desc    Verify a provider
// @access  Private (Admin only)
router.put('/verify/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized, admin only' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { verified: true }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User verified successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
