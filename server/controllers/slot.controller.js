const mongoose = require('mongoose');
const Slot = require('../models/Slot');
const Stadium = require('../models/Stadium');
const Pitch = require('../models/Pitch');

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isWithinNext7Days(dateStr) {
  if (!DATE_RE.test(dateStr)) return false;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const t = today();
  const maxDate = new Date(t);
  maxDate.setDate(t.getDate() + 6);
  return d >= t && d <= maxDate;
}

function durationHours(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return mins / 60;
}

function validateSlot({ date, startTime, endTime }) {
  if (!date || !startTime || !endTime) return 'date, startTime, endTime required';
  if (!isWithinNext7Days(date)) return 'date must be within the next 7 days';
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) return 'time must be HH:MM (24h)';
  if (startTime >= endTime) return 'startTime must be before endTime';
  return null;
}

async function loadPitchOwned(req, res, pitchId) {
  if (!mongoose.isValidObjectId(pitchId)) {
    res.status(400).json({ error: 'Invalid pitchId' });
    return null;
  }
  const pitch = await Pitch.findById(pitchId);
  if (!pitch) {
    res.status(404).json({ error: 'Pitch not found' });
    return null;
  }
  const stadium = await Stadium.findById(pitch.stadiumId);
  if (!stadium) {
    res.status(404).json({ error: 'Stadium not found' });
    return null;
  }
  if (stadium.ownerId.toString() !== req.user._id.toString()) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }
  return { pitch, stadium };
}

async function overlaps(pitchId, date, startTime, endTime) {
  return Slot.findOne({
    pitchId,
    date,
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  });
}

exports.create = async (req, res, next) => {
  try {
    const { pitchId, date, startTime, endTime, price } = req.body;
    const owned = await loadPitchOwned(req, res, pitchId);
    if (!owned) return;
    const { pitch, stadium } = owned;
    const err = validateSlot({ date, startTime, endTime });
    if (err) return res.status(400).json({ error: err });
    const conflict = await overlaps(pitchId, date, startTime, endTime);
    if (conflict) {
      return res
        .status(409)
        .json({ error: `Overlaps existing slot ${conflict.startTime}–${conflict.endTime}` });
    }
    let finalPrice;
    if (price !== undefined && price !== null) {
      if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ error: 'price must be a non-negative number' });
      }
      finalPrice = price;
    } else {
      finalPrice = Math.round(pitch.pricePerHour * durationHours(startTime, endTime));
    }
    try {
      const slot = await Slot.create({
        stadiumId: stadium._id,
        pitchId,
        date,
        startTime,
        endTime,
        price: finalPrice,
      });
      res.status(201).json(slot);
    } catch (e) {
      if (e.code === 11000) return res.status(409).json({ error: 'Slot already exists' });
      throw e;
    }
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
    const slot = await Slot.findById(req.params.id);
    if (!slot) return res.status(404).json({ error: 'Not found' });
    const stadium = await Stadium.findById(slot.stadiumId);
    if (!stadium || stadium.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (slot.status === 'reserved') {
      return res.status(409).json({ error: 'Cannot edit a reserved slot' });
    }
    const { price } = req.body;
    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ error: 'price must be a non-negative number' });
      }
      slot.price = price;
    }
    await slot.save();
    res.json(slot);
  } catch (e) {
    next(e);
  }
};

exports.listByStadium = async (req, res, next) => {
  try {
    const { stadiumId } = req.params;
    if (!mongoose.isValidObjectId(stadiumId)) return res.status(400).json({ error: 'Invalid id' });
    const t = today();
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(t);
      d.setDate(t.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
    const slots = await Slot.find({ stadiumId, date: { $in: dates } }).sort({ date: 1, startTime: 1 });
    res.json({ dates, slots });
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
    const slot = await Slot.findById(req.params.id);
    if (!slot) return res.status(404).json({ error: 'Not found' });
    const stadium = await Stadium.findById(slot.stadiumId);
    if (!stadium || stadium.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (slot.status === 'reserved') return res.status(409).json({ error: 'Cannot delete a reserved slot' });
    await slot.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
