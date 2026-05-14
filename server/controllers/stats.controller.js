const mongoose = require('mongoose');
const Slot = require('../models/Slot');
const Stadium = require('../models/Stadium');

function dateNDaysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

exports.owner = async (req, res, next) => {
  try {
    const ownerId = new mongoose.Types.ObjectId(req.user._id);
    const stadiums = await Stadium.find({ ownerId });
    const stadiumIds = stadiums.map((s) => s._id);

    if (!stadiumIds.length) {
      return res.json({
        totals: { allTime: 0, last7Days: 0 },
        perDay: [],
        perStadium: [],
        mostReserved: null,
        statusBreakdown: { available: 0, reserved: 0 },
      });
    }

    const since = dateNDaysAgo(6);

    const [allTime, last7Days, perDay, perStadium, statusAgg] = await Promise.all([
      Slot.countDocuments({ stadiumId: { $in: stadiumIds }, status: 'reserved' }),
      Slot.countDocuments({
        stadiumId: { $in: stadiumIds },
        status: 'reserved',
        date: { $gte: since },
      }),
      Slot.aggregate([
        { $match: { stadiumId: { $in: stadiumIds }, status: 'reserved', date: { $gte: since } } },
        { $group: { _id: '$date', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Slot.aggregate([
        { $match: { stadiumId: { $in: stadiumIds } } },
        {
          $group: {
            _id: '$stadiumId',
            total: { $sum: 1 },
            reserved: { $sum: { $cond: [{ $eq: ['$status', 'reserved'] }, 1, 0] } },
          },
        },
      ]),
      Slot.aggregate([
        { $match: { stadiumId: { $in: stadiumIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const nameById = Object.fromEntries(stadiums.map((s) => [s._id.toString(), s.name]));
    const perStadiumWithNames = perStadium.map((p) => ({
      stadiumId: p._id,
      stadiumName: nameById[p._id.toString()] || 'Unknown',
      total: p.total,
      reserved: p.reserved,
      occupancyRate: p.total ? p.reserved / p.total : 0,
    }));

    const mostReserved = perStadiumWithNames
      .slice()
      .sort((a, b) => b.reserved - a.reserved)[0] || null;

    const statusBreakdown = { available: 0, reserved: 0 };
    for (const s of statusAgg) statusBreakdown[s._id] = s.count;

    const dates = Array.from({ length: 7 }, (_, i) => dateNDaysAgo(6 - i));
    const perDayMap = Object.fromEntries(perDay.map((d) => [d._id, d.count]));
    const perDayFilled = dates.map((date) => ({ date, count: perDayMap[date] || 0 }));

    res.json({
      totals: { allTime, last7Days },
      perDay: perDayFilled,
      perStadium: perStadiumWithNames,
      mostReserved,
      statusBreakdown,
    });
  } catch (e) {
    next(e);
  }
};
