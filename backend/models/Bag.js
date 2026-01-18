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

// Index for faster queries
bagSchema.index({ userId: 1 });

module.exports = mongoose.model('Bag', bagSchema);
