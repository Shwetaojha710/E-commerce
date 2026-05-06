const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const { uploadAvatar } = require('../config/cloudinary');
const {
  getProfile, updateProfile, updateAvatar,
  toggleWishlist, getWishlist, getRecentlyViewed,
  getAllUsers, toggleUserStatus,
} = require('../controllers/user.controller');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/avatar', uploadAvatar, updateAvatar);
router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', toggleWishlist);
router.delete('/wishlist/:productId', toggleWishlist);
router.get('/recently-viewed', getRecentlyViewed);

// Admin
router.get('/', adminOnly, getAllUsers);
router.patch('/:id/toggle-status', adminOnly, toggleUserStatus);

module.exports = router;
