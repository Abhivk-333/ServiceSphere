const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'started_travel', 'arrived', 'active', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  appointmentDate: { type: Date, required: true },
  appointmentTime: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  tracking: [{
    status: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
