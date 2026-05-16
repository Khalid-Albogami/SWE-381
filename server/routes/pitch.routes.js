const router = require('express').Router();
const c = require('../controllers/pitch.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', c.list);
router.post('/', requireAuth, requireRole('owner'), c.create);
router.put('/:id', requireAuth, requireRole('owner'), c.update);
router.delete('/:id', requireAuth, requireRole('owner'), c.remove);

module.exports = router;
