const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const { getDashboardStats, getSalesAnalytics } = require('../controllers/admin.controller');

router.use(protect, adminOnly);

router.get('/dashboard', getDashboardStats);
router.get('/analytics/sales', getSalesAnalytics);

module.exports = router;
