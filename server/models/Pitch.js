const mongoose = require('mongoose');

const pitchSchema = new mongoose.Schema(
  {
    stadiumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stadium', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    pricePerHour: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

pitchSchema.index({ stadiumId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Pitch', pitchSchema);
