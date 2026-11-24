const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { userSummary } = require('../utils/gamification');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// The React app uploads the picture straight to Cloudinary and sends us the hosted URL.
// We only accept Cloudinary URLs so nobody can store arbitrary links.
const CLOUDINARY_URL = /^https:\/\/res\.cloudinary\.com\//;

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { username, email, password, avatarUrl } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email and password are required' });
    }
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (avatarUrl && !CLOUDINARY_URL.test(avatarUrl)) {
      return res.status(400).json({ message: 'avatarUrl must be a Cloudinary URL' });
    }
    const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (exists) return res.status(409).json({ message: 'Username or email already in use' });

    const user = await User.create({ username, email, password, avatarUrl: avatarUrl || '' });
    res.status(201).json({ token: signToken(user._id), user: userSummary(user) });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ token: signToken(user._id), user: userSummary(user) });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// GET /api/auth/me  (includes the saved theme, so it persists across devices)
exports.getMe = (req, res) => res.json({ user: userSummary(req.user) });

// PUT /api/auth/profile  { theme?, avatarUrl?, username? }
exports.updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { theme, avatarUrl, username } = req.body;

    if (theme !== undefined) {
      if (!['dark', 'light'].includes(theme)) return res.status(400).json({ message: 'theme must be "dark" or "light"' });
      user.theme = theme;
    }
    if (avatarUrl !== undefined) {
      if (avatarUrl !== '' && !CLOUDINARY_URL.test(avatarUrl)) {
        return res.status(400).json({ message: 'avatarUrl must be a Cloudinary URL' });
      }
      user.avatarUrl = avatarUrl;
    }
    if (username && username !== user.username) {
      if (await User.findOne({ username })) return res.status(409).json({ message: 'Username already taken' });
      user.username = username;
    }
    await user.save();
    res.json({ user: userSummary(user) });
  } catch (err) {
    res.status(500).json({ message: 'Could not update profile', error: err.message });
  }
};
