const mongoose = require('mongoose');

const stadiumSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    location: {
      city: { type: String, required: true, trim: true, index: true },
      address: { type: String, default: '' },
    },
    photos: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Stadium', stadiumSchema);
