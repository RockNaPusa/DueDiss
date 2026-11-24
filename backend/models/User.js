const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },

    // HCI: preferences persisted in the DB so they follow the user across devices
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    avatarUrl: { type: String, default: '' }, // hosted Cloudinary URL

    // Gamification
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    tasksOnTime: { type: Number, default: 0 }, // total tasks completed on time
    totalOverdue: { type: Number, default: 0 }, // total tasks that ever went overdue
    winStreak: { type: Number, default: 0 },
    loseStreak: { type: Number, default: 0 },
    badges: { type: [String], default: [] },

    // roaster.ai
    riskLevel: { type: String, enum: ['Mild', 'Medium', 'Savage'], default: 'Mild' },
    roasterMuted: { type: Boolean, default: false },
    roastsReceived: { type: Number, default: 0 }, // shown in the Hall of Shame
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (typed) {
  return bcrypt.compare(typed, this.password);
};

module.exports = mongoose.model('User', userSchema);
