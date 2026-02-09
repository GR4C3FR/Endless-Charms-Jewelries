const mongoose = require('mongoose');

const bagSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: {
    type: Array,
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Bag', bagSchema);
