const mongoose = require('mongoose');

const CoachSchema = new mongoose.Schema({
  name: String,
  sport: String,
  rating: Number,
});

module.exports = mongoose.model('Coach', CoachSchema);
