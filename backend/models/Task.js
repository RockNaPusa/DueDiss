const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    deadline: { type: Date, required: true }, // ISO 8601 UTC

    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    isOverdue: { type: Boolean, default: false },
    completedAt: { type: Date },
    completedLate: { type: Boolean, default: false },
    xpEarned: { type: Number, default: 0 },

    // Halls
    inHallOfShame: { type: Boolean, default: false }, // set automatically when the deadline passes
    inHallOfFame: { type: Boolean, default: false }, // on-time completions + Mercy Rule moves
    lateConfession: { type: Boolean, default: false }, // the gray "Verified Late" tag
    memeUrl: { type: String, default: '' }, // victory meme earned (Hall of Fame)

    // Embedded status history array (shows embedded data modeling)
    statusHistory: {
      type: [{ status: String, at: { type: Date, default: Date.now }, _id: false }],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
