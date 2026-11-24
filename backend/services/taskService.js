// Server-side deadline checking. The server clock (UTC) is the only clock that counts,
// so changing the device clock in the browser cannot dodge the Hall of Shame.
const Task = require('../models/Task');
const AuditLog = require('../models/AuditLog');
const { awardNewBadges } = require('../utils/gamification');

// Finds pending tasks whose deadline has passed and sends them to the Hall of Shame.
// Each task is "claimed" atomically, so it is only ever penalised once even if
// several requests arrive at the same time (e.g. the 60-second React interval).
const refreshOverdue = async (user) => {
  const due = await Task.find({
    user: user._id, status: 'pending', isOverdue: false, deadline: { $lt: new Date() },
  }).select('_id');

  const claimed = [];
  for (const t of due) {
    const doc = await Task.findOneAndUpdate(
      { _id: t._id, isOverdue: false },
      { $set: { isOverdue: true, inHallOfShame: true }, $push: { statusHistory: { status: 'overdue', at: new Date() } } },
      { new: true }
    );
    if (doc) claimed.push(doc);
  }
  if (claimed.length === 0) return { newlyOverdue: 0, newBadges: [] };

  // Missed deadline: lose streak goes up, win streak is broken
  user.totalOverdue += claimed.length;
  user.loseStreak += claimed.length;
  user.winStreak = 0;
  const newBadges = awardNewBadges(user);
  await user.save();

  await AuditLog.insertMany(
    claimed.map((t) => ({ user: user._id, task: t._id, action: 'BECAME_OVERDUE', details: t.title }))
  );
  return { newlyOverdue: claimed.length, newBadges };
};

// The exact 4 features Chani's scikit-learn model was trained on
const getUserStats = async (user) => {
  const [active, overdue, high] = await Promise.all([
    Task.countDocuments({ user: user._id, status: 'pending' }),
    Task.countDocuments({ user: user._id, status: 'pending', isOverdue: true }),
    Task.countDocuments({ user: user._id, status: 'pending', priority: 'High' }),
  ]);
  return {
    active_tasks_count: active,
    overdue_tasks_count: overdue,
    high_priority_count: high,
    win_streak: user.winStreak,
  };
};

module.exports = { refreshOverdue, getUserStats };
