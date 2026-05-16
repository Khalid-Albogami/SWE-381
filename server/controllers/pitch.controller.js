const mongoose = require('mongoose');
const Pitch = require('../models/Pitch');
const Stadium = require('../models/Stadium');
const Slot = require('../models/Slot');

async function ensureStadiumOwner(req, res, stadiumId) {
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

async function loadOwnedPitch(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ error: 'Pitch not found' });
    return null;
  }
  const pitch = await Pitch.findById(req.params.id);
  if (!pitch) {
    res.status(404).json({ error: 'Pitch not found' });
    return null;
  }
  const stadium = await Stadium.findById(pitch.stadiumId);
  if (!stadium || stadium.ownerId.toString() !== req.user._id.toString()) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }
  return pitch;
}

exports.list = async (req, res, next) => {
  try {
    const { stadiumId } = req.query;
    if (!stadiumId || !mongoose.isValidObjectId(stadiumId)) {
      return res.status(400).json({ error: 'stadiumId required' });
    }
    const pitches = await Pitch.find({ stadiumId }).sort({ createdAt: 1 });
    res.json(pitches);
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { stadiumId, name, description, pricePerHour } = req.body;
    if (!name || pricePerHour === undefined || pricePerHour === null) {
      return res.status(400).json({ error: 'name and pricePerHour required' });
    }
    if (typeof pricePerHour !== 'number' || pricePerHour < 0) {
      return res.status(400).json({ error: 'pricePerHour must be a non-negative number' });
    }
    const stadium = await ensureStadiumOwner(req, res, stadiumId);
    if (!stadium) return;
    try {
      const pitch = await Pitch.create({
        stadiumId,
        name: name.trim(),
        description: description || '',
        pricePerHour,
      });
      res.status(201).json(pitch);
    } catch (e) {
      if (e.code === 11000) return res.status(409).json({ error: 'A pitch with this name already exists' });
      throw e;
    }
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const pitch = await loadOwnedPitch(req, res);
    if (!pitch) return;
    const { name, description, pricePerHour } = req.body;
    if (name !== undefined) pitch.name = String(name).trim();
    if (description !== undefined) pitch.description = description;
    if (pricePerHour !== undefined) {
      if (typeof pricePerHour !== 'number' || pricePerHour < 0) {
        return res.status(400).json({ error: 'pricePerHour must be a non-negative number' });
      }
      pitch.pricePerHour = pricePerHour;
    }
    try {
      await pitch.save();
      res.json(pitch);
    } catch (e) {
      if (e.code === 11000) return res.status(409).json({ error: 'A pitch with this name already exists' });
      throw e;
    }
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const pitch = await loadOwnedPitch(req, res);
    if (!pitch) return;
    const reserved = await Slot.findOne({ pitchId: pitch._id, status: 'reserved' });
    if (reserved) {
      return res.status(409).json({ error: 'Cannot delete a pitch that has active reservations' });
    }
    await Slot.deleteMany({ pitchId: pitch._id });
    await pitch.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
