const mongoose = require('mongoose');
const Slot = require('../models/Slot');

exports.reserve = async (req, res, next) => {
  try {
    const { slotId } = req.params;
    if (!mongoose.isValidObjectId(slotId)) return res.status(404).json({ error: 'Slot not found' });

    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, status: 'available' },
      { $set: { status: 'reserved', reservedBy: req.user._id, reservedAt: new Date() } },
      { new: true }
    );

    if (!slot) {
      const exists = await Slot.findById(slotId);
      if (!exists) return res.status(404).json({ error: 'Slot not found' });
      return res.status(409).json({ error: 'Slot is no longer available' });
    }
    res.json(slot);
  } catch (e) {
    next(e);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const { slotId } = req.params;
    if (!mongoose.isValidObjectId(slotId)) return res.status(404).json({ error: 'Slot not found' });

    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, status: 'reserved', reservedBy: req.user._id },
      { $set: { status: 'available', reservedBy: null, reservedAt: null } },
      { new: true }
    );

    if (!slot) {
      const exists = await Slot.findById(slotId);
      if (!exists) return res.status(404).json({ error: 'Slot not found' });
      return res.status(403).json({ error: 'You can only cancel your own reservation' });
    }
    res.json(slot);
  } catch (e) {
    next(e);
  }
};

exports.mine = async (req, res, next) => {
  try {
    const reservations = await Slot.find({ reservedBy: req.user._id, status: 'reserved' })
      .sort({ date: 1, startTime: 1 })
      .populate({ path: 'stadiumId', select: 'name location photos ownerId' })
      .populate({ path: 'pitchId', select: 'name pricePerHour' });
    res.json(reservations);
  } catch (e) {
    next(e);
  }
};
