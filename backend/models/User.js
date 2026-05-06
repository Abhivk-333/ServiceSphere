const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'provider', 'admin'], default: 'customer' },
  profilePic: { type: String, default: null },
  verified: { type: Boolean, default: false },
  
  // Provider fields
  category: { type: String, default: null },
  experience: { type: String, default: null },
  govtId: { type: String, default: null },
  location: { type: String, default: null },
  earnings: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
