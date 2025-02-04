const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    registrationType: { type: String, required: true }, // تسجيل نوع التسجيل (email, google, microsoft)
});

const Account = mongoose.model('Account', accountSchema);
module.exports = Account;
