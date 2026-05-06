const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getWishlist, toggleWishlist } = require('../controllers/user.controller');

router.use(protect);
router.get('/', getWishlist);
router.post('/:productId', toggleWishlist);
router.delete('/:productId', toggleWishlist);

module.exports = router;
