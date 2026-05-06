const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Temporary OTP Store (In a real app, use Redis or DB with TTL)
const otpStore = new Map();

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a user or provider
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role, govtId } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with that email or phone' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role: role || 'customer',
      govtId: role === 'provider' ? govtId : null,
      verified: role === 'provider' ? false : true // Providers need manual verification usually
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        verified: user.verified,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    const { phone, password, role } = req.body;

    const user = await User.findOne({ phone, role });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        verified: user.verified,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/send-otp
// @desc    Send OTP to phone (Console simulation for now)
router.post('/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone is required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, { otp, expires: Date.now() + 5 * 60 * 1000 }); // 5 mins

  console.log(`📲 [DEV] OTP for ${phone}: ${otp}`); // SIMULATE SENDING OTP
  
  // To use Nodemailer, we would set up a transporter and send email here if an email was provided.
  res.json({ message: 'OTP sent successfully' });
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, role } = req.body;
    
    const record = otpStore.get(phone);
    if (!record) return res.status(400).json({ message: 'OTP not found or expired' });
    if (Date.now() > record.expires) {
      otpStore.delete(phone);
      return res.status(400).json({ message: 'OTP expired' });
    }
    if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    // Clean up
    otpStore.delete(phone);

    // Find User
    let user = await User.findOne({ phone, role });
    
    // Auto-create user if missing (for seamless OTP login) - minimal fields
    if (!user) {
       user = await User.create({
         firstName: "New",
         lastName: "User",
         email: `temp_${Date.now()}@domain.com`,
         phone,
         password: await bcrypt.hash(Date.now().toString(), 10), // Random password
         role,
         verified: role === 'provider' ? false : true
       });
    }

    res.json({
      _id: user.id,
      firstName: user.firstName,
      role: user.role,
      verified: user.verified,
      token: generateToken(user._id, user.role),
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
