const mongo = require('../../server/mongodb');
const mongoose = require('mongoose');

module.exports = mongo.model('Visit', new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  hash: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}));
