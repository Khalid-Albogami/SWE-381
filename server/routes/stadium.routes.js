const router = require('express').Router();
const c = require('../controllers/stadium.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', c.list);
router.get('/owner/mine', requireAuth, requireRole('owner'), c.mine);
router.get('/:id', c.get);

router.post('/', requireAuth, requireRole('owner'), upload.array('photos', 8), c.create);
router.put('/:id', requireAuth, requireRole('owner'), upload.array('photos', 8), c.update);
router.delete('/:id', requireAuth, requireRole('owner'), c.remove);

module.exports = router;
