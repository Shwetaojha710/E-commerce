const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const {
  getCart, addToCart, updateCartItem, removeFromCart, clearCart, applyCoupon, removeCoupon,
} = require('../controllers/cart.controller');

router.use(protect);

router.get('/', getCart);
router.post('/add', [
  body('productId').isMongoId().withMessage('Valid product ID required'),
  body('quantity').optional().isInt({ min: 1, max: 10 }).withMessage('Quantity must be 1-10'),
  validate,
], addToCart);
router.put('/items/:itemId', [
  body('quantity').isInt({ min: 0, max: 10 }).withMessage('Quantity must be 0-10'),
  validate,
], updateCartItem);
router.delete('/items/:itemId', removeFromCart);
router.delete('/', clearCart);
router.post('/coupon', [
  body('couponCode').trim().notEmpty().withMessage('Coupon code is required'),
  validate,
], applyCoupon);
router.delete('/coupon', removeCoupon);

module.exports = router;
