const router = require('express').Router();
const c = require('../controllers/stats.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/owner', requireAuth, requireRole('owner'), c.owner);

module.exports = router;
