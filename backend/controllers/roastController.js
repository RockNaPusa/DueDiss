const Task = require('../models/Task');
const Roast = require('../models/Roast');
const AuditLog = require('../models/AuditLog');
const { RISK_LEVELS, getRiskLevel, getGeminiRoast } = require('../services/externalApis');
const { refreshOverdue, getUserStats } = require('../services/taskService');
const { userSummary } = require('../utils/gamification');

const LAST_RESORT = 'Even my backup roasts are procrastinating. Go finish something.';

// GET /api/roasts            -> roast for the user's current risk level
// GET /api/roasts/random?level=Savage  -> "Roast Me Again" (fresh roast, no page reload)
exports.getRoast = async (req, res) => {
  const user = req.user;
  try {
    if (user.roasterMuted) {
      return res.json({ muted: true, roast: null, message: 'The roaster is muted. Enjoy the silence.' });
    }

    await refreshOverdue(user);
    const actual = await getRiskLevel(await getUserStats(user));
    if (actual !== user.riskLevel) user.riskLevel = actual;

    // Use ?level= when valid (e.g. the level shown on screen), otherwise the real one
    const asked = RISK_LEVELS.find((r) => r.toLowerCase() === String(req.query.level || '').toLowerCase());
    const level = asked || actual;

    const overdueTask = await Task.findOne({ user: user._id, status: 'pending', isOverdue: true }).sort({ deadline: 1 });
    const taskTitle = overdueTask ? overdueTask.title : null;
    const examples = await Roast.aggregate([{ $match: { level } }, { $sample: { size: 3 } }]);

    let roast, source;
    try {
      roast = await getGeminiRoast({ riskLevel: level, taskTitle, examples: examples.map((e) => e.text) });
      source = 'gemini';
    } catch (err) {
      // Safety net: fails, times out (>3s) or rate-limited -> pre-written roast from MongoDB
      console.warn('Gemini failed, using stored roast:', err.message);
      const [stored] = await Roast.aggregate([{ $match: { level } }, { $sample: { size: 1 } }]);
      roast = stored ? stored.text : LAST_RESORT;
      source = 'fallback';
    }

    user.roastsReceived += 1;
    await user.save();
    res.json({ muted: false, roast, source, riskLevel: level, overdueTask: taskTitle });
  } catch (err) {
    // Never show an error screen during the live defense
    res.json({ muted: false, roast: LAST_RESORT, source: 'fallback', riskLevel: user.riskLevel });
  }
};

// PUT /api/roasts/mute  -> "Mute the Roaster" panic button: silences roasts AND resets the Win Streak to 0
exports.muteRoaster = async (req, res) => {
  try {
    const user = req.user;
    user.roasterMuted = true;
    user.winStreak = 0;
    await user.save();
    await AuditLog.create({ user: user._id, action: 'ROASTER_MUTED', details: 'Win streak reset to 0' });
    res.json({ message: 'Roaster muted. Your win streak paid the price.', user: userSummary(user) });
  } catch (err) {
    res.status(500).json({ message: 'Could not mute roaster', error: err.message });
  }
};

// PUT /api/roasts/unmute
exports.unmuteRoaster = async (req, res) => {
  try {
    req.user.roasterMuted = false;
    await req.user.save();
    await AuditLog.create({ user: req.user._id, action: 'ROASTER_UNMUTED' });
    res.json({ message: 'The roaster is back.', user: userSummary(req.user) });
  } catch (err) {
    res.status(500).json({ message: 'Could not unmute roaster', error: err.message });
  }
};
