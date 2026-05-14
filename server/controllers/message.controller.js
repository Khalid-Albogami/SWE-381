const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const Stadium = require('../models/Stadium');

exports.send = async (req, res, next) => {
  try {
    const { receiverId, stadiumId, content } = req.body;
    if (!receiverId || !stadiumId || !content || !content.trim()) {
      return res.status(400).json({ error: 'receiverId, stadiumId, content required' });
    }
    if (!mongoose.isValidObjectId(receiverId) || !mongoose.isValidObjectId(stadiumId)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }
    const [receiver, stadium] = await Promise.all([
      User.findById(receiverId),
      Stadium.findById(stadiumId),
    ]);
    if (!receiver) return res.status(404).json({ error: 'Receiver not found' });
    if (!stadium) return res.status(404).json({ error: 'Stadium not found' });
    const msg = await Message.create({
      senderId: req.user._id,
      receiverId,
      stadiumId,
      content: content.trim(),
    });
    res.status(201).json(msg);
  } catch (e) {
    next(e);
  }
};

exports.thread = async (req, res, next) => {
  try {
    const { otherUserId, stadiumId } = req.params;
    if (!mongoose.isValidObjectId(otherUserId) || !mongoose.isValidObjectId(stadiumId)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const me = req.user._id;
    const messages = await Message.find({
      stadiumId,
      $or: [
        { senderId: me, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: me },
      ],
    }).sort({ createdAt: 1 });

    await Message.updateMany(
      { stadiumId, senderId: otherUserId, receiverId: me, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (e) {
    next(e);
  }
};

exports.inbox = async (req, res, next) => {
  try {
    const me = new mongoose.Types.ObjectId(req.user._id);
    const threads = await Message.aggregate([
      { $match: { $or: [{ senderId: me }, { receiverId: me }] } },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          otherUserId: { $cond: [{ $eq: ['$senderId', me] }, '$receiverId', '$senderId'] },
        },
      },
      {
        $group: {
          _id: { otherUserId: '$otherUserId', stadiumId: '$stadiumId' },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$receiverId', me] }, { $eq: ['$read', false] }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id.otherUserId',
          foreignField: '_id',
          as: 'otherUser',
        },
      },
      {
        $lookup: {
          from: 'stadiums',
          localField: '_id.stadiumId',
          foreignField: '_id',
          as: 'stadium',
        },
      },
      { $unwind: { path: '$otherUser', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$stadium', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          otherUserId: '$_id.otherUserId',
          stadiumId: '$_id.stadiumId',
          otherUserName: '$otherUser.name',
          stadiumName: '$stadium.name',
          lastMessage: {
            content: '$lastMessage.content',
            createdAt: '$lastMessage.createdAt',
            senderId: '$lastMessage.senderId',
          },
          unreadCount: 1,
        },
      },
    ]);
    res.json(threads);
  } catch (e) {
    next(e);
  }
};
