const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    stadiumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stadium', required: true, index: true },
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
