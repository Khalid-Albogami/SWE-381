const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Stadium = require('../models/Stadium');
const Slot = require('../models/Slot');
const Pitch = require('../models/Pitch');

function photoPaths(files) {
  return (files || []).map((f) => `/uploads/stadiums/${path.basename(f.path)}`);
}

exports.create = async (req, res, next) => {
  try {
    const { name, description, city, address } = req.body;
    if (!name || !city) return res.status(400).json({ error: 'name and city required' });
    const stadium = await Stadium.create({
      ownerId: req.user._id,
      name,
      description: description || '',
      location: { city, address: address || '' },
      photos: photoPaths(req.files),
    });
    res.status(201).json(stadium);
  } catch (e) {
    next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const { city, date, startTime } = req.query;
    const filter = {};
    if (city) filter['location.city'] = new RegExp(`^${city}$`, 'i');

    let stadiums = await Stadium.find(filter).sort({ createdAt: -1 });

    if (date || startTime) {
      const slotFilter = { status: 'available' };
      if (date) slotFilter.date = date;
      if (startTime) slotFilter.startTime = startTime;
      const matchingStadiumIds = await Slot.distinct('stadiumId', slotFilter);
      const idSet = new Set(matchingStadiumIds.map((id) => id.toString()));
      stadiums = stadiums.filter((s) => idSet.has(s._id.toString()));
    }
    res.json(stadiums);
  } catch (e) {
    next(e);
  }
};

exports.get = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
    const stadium = await Stadium.findById(req.params.id).populate('ownerId', 'name email');
    if (!stadium) return res.status(404).json({ error: 'Not found' });
    res.json(stadium);
  } catch (e) {
    next(e);
  }
};

exports.mine = async (req, res, next) => {
  try {
    const stadiums = await Stadium.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    res.json(stadiums);
  } catch (e) {
    next(e);
  }
};

async function loadOwned(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ error: 'Not found' });
    return null;
  }
  const stadium = await Stadium.findById(req.params.id);
  if (!stadium) {
    res.status(404).json({ error: 'Not found' });
    return null;
  }
  if (stadium.ownerId.toString() !== req.user._id.toString()) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }
  return stadium;
}

exports.update = async (req, res, next) => {
  try {
    const stadium = await loadOwned(req, res);
    if (!stadium) return;
    const { name, description, city, address } = req.body;
    if (name !== undefined) stadium.name = name;
    if (description !== undefined) stadium.description = description;
    if (city !== undefined) stadium.location.city = city;
    if (address !== undefined) stadium.location.address = address;
    if (req.files && req.files.length) {
      stadium.photos = [...stadium.photos, ...photoPaths(req.files)];
    }
    await stadium.save();
    res.json(stadium);
  } catch (e) {
    next(e);
  }
};

exports.removePhoto = async (req, res, next) => {
  try {
    const stadium = await loadOwned(req, res);
    if (!stadium) return;
    const { filename } = req.params;
    const target = stadium.photos.find((p) => path.basename(p) === filename);
    if (!target) return res.status(404).json({ error: 'Photo not found' });
    stadium.photos = stadium.photos.filter((p) => p !== target);
    await stadium.save();
    const abs = path.join(__dirname, '..', target);
    fs.promises.unlink(abs).catch(() => {});
    res.json(stadium);
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const stadium = await loadOwned(req, res);
    if (!stadium) return;
    for (const rel of stadium.photos) {
      const abs = path.join(__dirname, '..', rel);
      fs.promises.unlink(abs).catch(() => {});
    }
    await Slot.deleteMany({ stadiumId: stadium._id });
    await Pitch.deleteMany({ stadiumId: stadium._id });
    await stadium.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
