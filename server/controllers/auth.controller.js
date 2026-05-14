const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function sign(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, role are required' });
    }
    if (!['owner', 'user'].includes(role)) {
      return res.status(400).json({ error: 'role must be owner or user' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already in use' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role });
    const token = sign(user);
    res.status(201).json({ token, user: user.toPublic() });
  } catch (e) {
    next(e);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = sign(user);
    res.json({ token, user: user.toPublic() });
  } catch (e) {
    next(e);
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user.toPublic() });
};
