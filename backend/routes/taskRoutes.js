const router = require('express').Router();
const c = require('../controllers/taskController');
const protect = require('../middleware/authMiddleware');

router.use(protect); // every task route needs a valid JWT

// Specific paths first so they are not swallowed by "/:id"
router.get('/hall-of-fame', c.getHallOfFame);
router.get('/hall-of-shame', c.getHallOfShame);
router.get('/badges', c.getBadges);
router.get('/audit-log', c.getAuditLog);
router.post('/mercy/:id', c.applyMercyRule);
router.put('/complete/:id', c.completeTask);

router.route('/').get(c.getTasks).post(c.createTask);
router.route('/:id').put(c.updateTask).delete(c.deleteTask);

module.exports = router;
