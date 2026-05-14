const router = require('express').Router();
const c = require('../controllers/message.controller');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, c.send);
router.get('/inbox', requireAuth, c.inbox);
router.get('/thread/:otherUserId/:stadiumId', requireAuth, c.thread);

module.exports = router;
