// Run once: npm run seed   (placeholder roasts - replace with Chani's real lines)
require('dotenv').config();
const mongoose = require('mongoose');
const Roast = require('./models/Roast');

const roasts = [
  { level: 'Mild', text: 'That task is not going to finish itself. Believe me, I checked.' },
  { level: 'Mild', text: 'Your to-do list called. It would like some attention.' },
  { level: 'Mild', text: 'A gentle reminder that deadlines are not just suggestions.' },
  { level: 'Medium', text: 'Overdue again? Your deadline left without you.' },
  { level: 'Medium', text: 'You treat deadlines like a buffet: take what you want, ignore the rest.' },
  { level: 'Medium', text: 'Bold strategy, letting this task age like milk.' },
  { level: 'Savage', text: 'This task has been overdue so long it qualifies for a pension.' },
  { level: 'Savage', text: 'Your productivity is a rumor, and the rumor is not good.' },
  { level: 'Savage', text: 'I have seen glaciers move faster than you on this task.' },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Roast.deleteMany({});
  await Roast.insertMany(roasts);
  console.log(`Seeded ${roasts.length} roasts`);
  await mongoose.disconnect();
})();
