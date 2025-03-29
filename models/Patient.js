const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patient_name: { type: String, required: false },
  phone_number: { type: String, required: false },
  email: { type: String, required: false },
  identity_number: { type: String, required: false },
  appointment_date: { type: String, required: false },
  appointment_time: { type: String, required: false },
  appointment_reason: { type: String, required: false },
  preferred_doctor: { type: String },
  additional_notes: { type: String },
  has_insurance: { type: Boolean },
  insurance_company: { type: String },
  insurance_policy_number: { type: String },
  agree_to_terms: { type: Boolean, required: false },
  reminder_method: { type: String, required: false },
  booked_at: { type: Date, default: Date.now },
  appointment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }
});

module.exports = mongoose.model('Patient', patientSchema);
