const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, sparse: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  fullName: { type: String },
});

module.exports = mongoose.model('User', UserSchema);
