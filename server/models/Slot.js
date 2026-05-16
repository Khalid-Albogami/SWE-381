const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    stadiumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stadium', required: true, index: true },
    pitchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pitch', required: true, index: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['available', 'reserved'], default: 'available', index: true },
    reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reservedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

slotSchema.index({ pitchId: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);
