const router = require('express').Router();
const c = require('../controllers/reservation.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/mine', requireAuth, requireRole('user'), c.mine);
router.post('/:slotId', requireAuth, requireRole('user'), c.reserve);
router.delete('/:slotId', requireAuth, requireRole('user'), c.cancel);

module.exports = router;
