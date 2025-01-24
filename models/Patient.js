const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patient_name: { type: String, required: true },
  phone_number: { type: String, required: true },
  email: { type: String, required: true },
  identity_number: { type: String, required: true },
  appointment_date: { type: String, required: true },
  appointment_time: { type: String, required: true },
  appointment_reason: { type: String, required: true },
  preferred_doctor: { type: String },
  additional_notes: { type: String },
  has_insurance: { type: Boolean },
  insurance_company: { type: String },
  insurance_policy_number: { type: String },
  agree_to_terms: { type: Boolean, required: true },
  reminder_method: { type: String, required: true },
  booked_at: { type: Date, default: Date.now },
  appointment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }
});

module.exports = mongoose.model('Patient', patientSchema);
