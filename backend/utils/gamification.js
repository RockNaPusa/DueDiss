// XP, levels, badges. All the game rules live here so they are easy to tweak.

const XP_BY_PRIORITY = { Low: 20, Medium: 50, High: 100 };
const STREAK_BONUS_THRESHOLD = 3; // win streak that triggers the clapping-cat bonus meme

// XP needed to go from `level` to `level + 1` (Lv1 -> 100, Lv2 -> 150, Lv3 -> 200 ...)
const xpNeededForLevel = (level) => 100 + (level - 1) * 50;

// Turns total XP into { level, xpIntoLevel, xpForNextLevel } for the progress bar
const getLevelInfo = (totalXp) => {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpNeededForLevel(level)) {
    remaining -= xpNeededForLevel(level);
    level += 1;
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: xpNeededForLevel(level) };
};

// The 6 exact badges
const BADGES = [
  { id: 'FIRST_BLOOD', type: 'win', name: 'First Blood', description: 'Complete 1 task on time', check: (u) => u.tasksOnTime >= 1 },
  { id: 'ON_A_ROLL', type: 'win', name: 'On a Roll', description: 'Reach a 5-task Win Streak', check: (u) => u.winStreak >= 5 },
  { id: 'UNSTOPPABLE', type: 'win', name: 'Unstoppable', description: 'Complete 15 total tasks on time', check: (u) => u.tasksOnTime >= 15 },
  { id: 'PROFESSIONAL_PROCRASTINATOR', type: 'shame', name: 'Professional Procrastinator', description: 'Accumulate 3 overdue tasks', check: (u) => u.totalOverdue >= 3 },
  { id: 'DEADLINE_DODGER', type: 'shame', name: 'Deadline Dodger', description: 'Accumulate 10 overdue tasks', check: (u) => u.totalOverdue >= 10 },
  { id: 'CERTIFIED_CLOWN', type: 'shame', name: 'Certified Clown', description: 'Reach a 5-task Lose Streak', check: (u) => u.loseStreak >= 5 },
];

// Adds any newly unlocked badges to the user (caller must save) and returns them
const awardNewBadges = (user) => {
  const unlocked = BADGES.filter((b) => !user.badges.includes(b.id) && b.check(user));
  user.badges.push(...unlocked.map((b) => b.id));
  return unlocked.map(({ id, name, type, description }) => ({ id, name, type, description }));
};

const userSummary = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  avatarUrl: user.avatarUrl,
  theme: user.theme,
  ...getLevelInfo(user.xp), // level, xpIntoLevel, xpForNextLevel
  xp: user.xp,
  tasksOnTime: user.tasksOnTime,
  totalOverdue: user.totalOverdue,
  winStreak: user.winStreak,
  loseStreak: user.loseStreak,
  badges: user.badges,
  riskLevel: user.riskLevel,
  roasterMuted: user.roasterMuted,
  roastsReceived: user.roastsReceived,
});

module.exports = {
  XP_BY_PRIORITY, STREAK_BONUS_THRESHOLD, BADGES,
  xpNeededForLevel, getLevelInfo, awardNewBadges, userSummary,
};
