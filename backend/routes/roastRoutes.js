const router = require('express').Router();
const c = require('../controllers/roastController');
const protect = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', c.getRoast);
router.get('/random', c.getRoast); // "Roast Me Again": /api/roasts/random?level=Savage
router.put('/mute', c.muteRoaster);
router.put('/unmute', c.unmuteRoaster);

module.exports = router;
