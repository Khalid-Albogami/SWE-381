const mongoose = require('mongoose');
const Slot = require('../models/Slot');
const Stadium = require('../models/Stadium');

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

function validateSlot({ date, startTime, endTime }) {
  if (!date || !startTime || !endTime) return 'date, startTime, endTime required';
  if (!isWithinNext7Days(date)) return 'date must be within the next 7 days';
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) return 'time must be HH:MM (24h)';
  if (startTime >= endTime) return 'startTime must be before endTime';
  return null;
}

async function ensureOwner(req, res, stadiumId) {
  if (!mongoose.isValidObjectId(stadiumId)) {
    res.status(400).json({ error: 'Invalid stadiumId' });
    return null;
  }
  const stadium = await Stadium.findById(stadiumId);
  if (!stadium) {
    res.status(404).json({ error: 'Stadium not found' });
    return null;
  }
  if (stadium.ownerId.toString() !== req.user._id.toString()) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }
  return stadium;
}

async function overlaps(stadiumId, date, startTime, endTime) {
  return Slot.findOne({
    stadiumId,
    date,
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  });
}

exports.create = async (req, res, next) => {
  try {
    const { stadiumId, date, startTime, endTime } = req.body;
    const stadium = await ensureOwner(req, res, stadiumId);
    if (!stadium) return;
    const err = validateSlot({ date, startTime, endTime });
    if (err) return res.status(400).json({ error: err });
    const conflict = await overlaps(stadiumId, date, startTime, endTime);
    if (conflict) {
      return res.status(409).json({
        error: `Overlaps existing slot ${conflict.startTime}–${conflict.endTime}`,
      });
    }
    try {
      const slot = await Slot.create({ stadiumId, date, startTime, endTime });
      res.status(201).json(slot);
    } catch (e) {
      if (e.code === 11000) return res.status(409).json({ error: 'Slot already exists' });
      throw e;
    }
  } catch (e) {
    next(e);
  }
};

exports.createBulk = async (req, res, next) => {
  try {
    const { stadiumId, slots } = req.body;
    if (!Array.isArray(slots) || !slots.length) {
      return res.status(400).json({ error: 'slots[] required' });
    }
    const stadium = await ensureOwner(req, res, stadiumId);
    if (!stadium) return;
    for (const s of slots) {
      const err = validateSlot(s);
      if (err) return res.status(400).json({ error: err });
    }
    const docs = slots.map((s) => ({ ...s, stadiumId }));
    const created = [];
    const conflicts = [];
    for (const doc of docs) {
      try {
        const conflict = await overlaps(doc.stadiumId, doc.date, doc.startTime, doc.endTime);
        if (conflict) {
          conflicts.push(doc);
          continue;
        }
        const c = await Slot.create(doc);
        created.push(c);
      } catch (e) {
        if (e.code === 11000) conflicts.push(doc);
        else throw e;
      }
    }
    res.status(201).json({ created, conflicts });
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
