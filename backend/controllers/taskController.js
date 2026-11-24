const Task = require('../models/Task');
const AuditLog = require('../models/AuditLog');
const {
  XP_BY_PRIORITY, STREAK_BONUS_THRESHOLD, BADGES, getLevelInfo, awardNewBadges, userSummary,
} = require('../utils/gamification');
const { getRiskLevel, getVictoryGif } = require('../services/externalApis');
const { refreshOverdue, getUserStats } = require('../services/taskService');

const log = (user, action, task, details = '') =>
  AuditLog.create({ user: user._id, task: task ? task._id : undefined, action, details });

// POST /api/tasks   (the React app sends the deadline as an ISO 8601 UTC string)
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, deadline } = req.body;
    if (!title || !deadline || isNaN(new Date(deadline))) {
      return res.status(400).json({ message: 'A title and a valid deadline are required' });
    }
    if (priority && !XP_BY_PRIORITY[priority]) {
      return res.status(400).json({ message: 'Priority must be Low, Medium or High' });
    }
    if (new Date(deadline).getTime() <= Date.now()) {
      return res.status(400).json({ message: 'Deadline must be in the future' });
    }
    const task = await Task.create({
      user: req.user._id, title, description, priority,
      deadline: new Date(deadline),
      statusHistory: [{ status: 'pending' }],
    });
    await log(req.user, 'TASK_CREATED', task, title);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Could not create task', error: err.message });
  }
};

// GET /api/tasks            -> active (pending) tasks
// GET /api/tasks?status=all -> everything
// The React 60-second setInterval just calls this again: the server re-checks every deadline.
exports.getTasks = async (req, res) => {
  try {
    const { newBadges } = await refreshOverdue(req.user);
    const filter = { user: req.user._id };
    if (req.query.status !== 'all') filter.status = req.query.status || 'pending';
    const tasks = await Task.find(filter).sort({ deadline: 1 });
    res.json({ serverTime: new Date().toISOString(), newBadges, tasks });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch tasks', error: err.message });
  }
};

// PUT /api/tasks/:id   (edit name, description, deadline, priority)
exports.updateTask = async (req, res) => {
  try {
    await refreshOverdue(req.user);
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.status !== 'pending') return res.status(400).json({ message: 'Only active tasks can be edited' });

    const { title, description, priority, deadline } = req.body;
    if (deadline !== undefined) {
      if (task.isOverdue) {
        return res.status(400).json({ message: 'Overdue tasks cannot get a new deadline (no dodging the Hall of Shame)' });
      }
      if (isNaN(new Date(deadline)) || new Date(deadline).getTime() <= Date.now()) {
        return res.status(400).json({ message: 'Deadline must be a valid future date' });
      }
      task.deadline = new Date(deadline);
    }
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) {
      if (!XP_BY_PRIORITY[priority]) return res.status(400).json({ message: 'Priority must be Low, Medium or High' });
      task.priority = priority;
    }
    await task.save();
    await log(req.user, 'TASK_UPDATED', task, task.title);
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Could not update task', error: err.message });
  }
};

// DELETE /api/tasks/:id   (permanent)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await log(req.user, 'TASK_DELETED', task, task.title);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete task', error: err.message });
  }
};

// PUT /api/tasks/complete/:id   (checkbox click)
exports.completeTask = async (req, res) => {
  try {
    const user = req.user;
    // Make sure a missed deadline is penalised BEFORE we decide on-time vs late
    await refreshOverdue(user);

    const task = await Task.findOne({ _id: req.params.id, user: user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.status !== 'pending') return res.status(400).json({ message: 'Task is already completed' });

    const now = new Date();
    const late = now.getTime() > task.deadline.getTime();
    const base = XP_BY_PRIORITY[task.priority];
    const xpEarned = late ? Math.floor(base / 2) : base; // +20/50/100 or +10/25/50

    task.status = 'completed';
    task.completedAt = now;
    task.completedLate = late;
    task.xpEarned = xpEarned;
    task.inHallOfFame = !late; // late tasks stay in the Hall of Shame
    task.statusHistory.push({ status: late ? 'completed_late' : 'completed_on_time', at: now });
    await task.save();

    user.xp += xpEarned;
    user.level = getLevelInfo(user.xp).level;
    if (!late) {
      user.tasksOnTime += 1;
      user.winStreak += 1;
      user.loseStreak = 0;
    } // a late completion changes no streak: the miss was already counted when the deadline passed
    const newBadges = awardNewBadges(user);

    // External services (both fail safely)
    const bonus = task.priority === 'High' || user.winStreak >= STREAK_BONUS_THRESHOLD;
    const stats = await getUserStats(user);
    const [riskLevel, gifUrl] = await Promise.all([getRiskLevel(stats), getVictoryGif(bonus)]);
    user.riskLevel = riskLevel;
    await user.save();

    task.memeUrl = gifUrl || '';
    await task.save();
    await log(user, late ? 'COMPLETED_LATE' : 'COMPLETED_ON_TIME', task, `${task.title} (+${xpEarned} XP)`);

    res.json({
      task, xpEarned, late, newBadges, riskLevel,
      meme: { url: gifUrl, bonus }, // bonus = show the clapping black cat + "Yey Cat" image
      user: userSummary(user),
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not complete task', error: err.message });
  }
};

// GET /api/tasks/hall-of-fame  -> on-time completions + their memes (+ Mercy "Late Confession" tasks)
exports.getHallOfFame = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id, inHallOfFame: true }).sort({ completedAt: -1 });
    res.json({ count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ message: 'Could not load Hall of Fame', error: err.message });
  }
};

// GET /api/tasks/hall-of-shame  -> every overdue task + roast statistics
exports.getHallOfShame = async (req, res) => {
  try {
    await refreshOverdue(req.user);
    const tasks = await Task.find({ user: req.user._id, inHallOfShame: true }).sort({ deadline: -1 });
    res.json({
      count: tasks.length,
      stats: {
        totalOverdue: req.user.totalOverdue,
        loseStreak: req.user.loseStreak,
        roastsReceived: req.user.roastsReceived,
      },
      tasks,
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not load Hall of Shame', error: err.message });
  }
};

// POST /api/tasks/mercy/:id   -> Mercy Rule: move ONE Hall of Shame task to the Hall of Fame
// Gets the gray "Verified Late" tag and never adds to the win streak.
exports.applyMercyRule = async (req, res) => {
  try {
    const user = req.user;
    const task = await Task.findOne({ _id: req.params.id, user: user._id });
    if (!task || !task.inHallOfShame) return res.status(404).json({ message: 'That task is not in the Hall of Shame' });

    const wasPending = task.status === 'pending';
    if (wasPending) {
      // Still open: treat as a late completion (half XP), no meme, no streak change
      const xp = Math.floor(XP_BY_PRIORITY[task.priority] / 2);
      task.status = 'completed';
      task.completedAt = new Date();
      task.completedLate = true;
      task.xpEarned = xp;
      user.xp += xp;
      user.level = getLevelInfo(user.xp).level;
    }
    task.lateConfession = true;
    task.inHallOfShame = false;
    task.inHallOfFame = true;
    task.statusHistory.push({ status: 'mercy_late_confession', at: new Date() });
    await task.save();

    if (wasPending) user.riskLevel = await getRiskLevel(await getUserStats(user));
    await user.save();
    await log(user, 'MERCY_RULE_APPLIED', task, task.title);

    res.json({ message: 'Moved to the Hall of Fame as a Late Confession.', task, user: userSummary(user) });
  } catch (err) {
    res.status(500).json({ message: 'Could not apply Mercy Rule', error: err.message });
  }
};

// GET /api/tasks/badges -> the 6 badges and which ones are earned
exports.getBadges = (req, res) => {
  res.json(
    BADGES.map((b) => ({ id: b.id, name: b.name, type: b.type, description: b.description, earned: req.user.badges.includes(b.id) }))
  );
};

// GET /api/tasks/audit-log -> latest 50 entries
exports.getAuditLog = async (req, res) => {
  try {
    const logs = await AuditLog.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Could not load audit log', error: err.message });
  }
};
