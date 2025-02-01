const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointment_id: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  // status: { type: String, default: 'available' },
  status: { type: String, enum: ["available", "booked", "locked"], default: "available" },
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null },
  doctor_id: { type: String, required: true }
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
