const router = require('express').Router();
const c = require('../controllers/slot.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/stadium/:stadiumId', c.listByStadium);
router.post('/', requireAuth, requireRole('owner'), c.create);
router.post('/bulk', requireAuth, requireRole('owner'), c.createBulk);
router.delete('/:id', requireAuth, requireRole('owner'), c.remove);

module.exports = router;
