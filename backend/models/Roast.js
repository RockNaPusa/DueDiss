const mongoose = require('mongoose');

// Pre-written roasts (Chani's lines). Used as Gemini examples AND as the fallback.
const roastSchema = new mongoose.Schema({
  text: { type: String, required: true },
  level: { type: String, enum: ['Mild', 'Medium', 'Savage'], required: true, index: true },
});

module.exports = mongoose.model('Roast', roastSchema);
