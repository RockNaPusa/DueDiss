// Outside-world calls: Chani's ML API, Giphy, Gemini. Every one fails safely.

const RISK_LEVELS = ['Mild', 'Medium', 'Savage'];

const fetchWithTimeout = async (url, options = {}, ms = 3000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

// Same labelling rule as the training data: 0 overdue = Mild, 1-2 = Medium, 3+ = Savage
const localRisk = (stats) => {
  const n = stats.overdue_tasks_count;
  if (n === 0) return 'Mild';
  if (n <= 2) return 'Medium';
  return 'Savage';
};

// ---- Python scikit-learn service (port 5001) ----
// ASSUMED contract (confirm with Chani):
//   POST {ML_API_URL}/predict  body = the 4 features  ->  { "risk_level": "Mild|Medium|Savage" }
const getRiskLevel = async (stats) => {
  try {
    const res = await fetchWithTimeout(
      `${process.env.ML_API_URL || 'http://localhost:5001'}/predict`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(stats) },
      2000
    );
    if (!res.ok) throw new Error(`ML API status ${res.status}`);
    const data = await res.json();
    const raw = String(data.risk || data.risk_level || data.riskLevel || '').toLowerCase();
    const match = RISK_LEVELS.find((r) => r.toLowerCase() === raw);
    if (!match) throw new Error('ML API returned an unknown risk level');
    return match;
  } catch (err) {
    console.warn('ML API unavailable, using local risk rule:', err.message);
    return localRisk(stats);
  }
};

// ---- Giphy: victory meme (clapping black cat for High priority / streak bonus) ----
const getVictoryGif = async (bonus) => {
  try {
    if (bonus && process.env.CLAPPING_CAT_GIF_URL) return process.env.CLAPPING_CAT_GIF_URL;
    if (!process.env.GIPHY_API_KEY) return null;
    const q = bonus ? 'black cat clapping' : 'victory celebration';
    const url = `https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=25&rating=pg`;
    const res = await fetchWithTimeout(url, {}, 2500);
    if (!res.ok) throw new Error(`Giphy status ${res.status}`);
    const { data } = await res.json();
    if (!data || data.length === 0) return null;
    return data[Math.floor(Math.random() * data.length)].images.original.url;
  } catch (err) {
    console.warn('Giphy unavailable:', err.message);
    return null;
  }
};

// ---- Google Gemini: few-shot prompt, 3-second timeout (caller handles the fallback) ----
const TONE = {
  Mild: 'a slightly annoyed, passive-aggressive observer, because the user is actually doing well',
  Medium: 'sarcastic and warning, because the user has a couple of overdue tasks',
  Savage: 'aggressive with heavy insults about their procrastination, because the user has 3+ overdue tasks',
};

const getGeminiRoast = async ({ riskLevel, taskTitle, examples }) => {
  if (!process.env.GEMINI_API_KEY) throw new Error('No GEMINI_API_KEY');
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const prompt = [
    `You are roaster.ai, a sarcastic productivity-app roaster. Risk level: ${riskLevel}. Tone: ${TONE[riskLevel]}.`,
    taskTitle
      ? `The user's overdue task is titled: "${taskTitle}".`
      : 'The user has no overdue tasks right now.',
    examples.length ? `Examples of the style for this level:\n- ${examples.join('\n- ')}` : '',
    'Write exactly ONE new sentence in that style. Roast the procrastination only: no profanity, nothing about identity, appearance or family. Return only the sentence.',
  ]
    .filter(Boolean)
    .join('\n\n');

  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 1, maxOutputTokens: 300 },
      }),
    },
    3000
  );
  if (!res.ok) throw new Error(`Gemini status ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error('Gemini returned empty text');
  return text;
};

module.exports = { RISK_LEVELS, localRisk, getRiskLevel, getVictoryGif, getGeminiRoast };
