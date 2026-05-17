const mongoose = require('mongoose');

const GroundSchema = new mongoose.Schema({
  name: String,
  city: String,
  available: Boolean,
});

module.exports = mongoose.model('Ground', GroundSchema);
