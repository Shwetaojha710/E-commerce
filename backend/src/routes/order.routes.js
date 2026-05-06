const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const {
  createOrder, getMyOrders, getOrderById,
  cancelOrder, getAllOrders, updateOrderStatus,
} = require('../controllers/order.controller');

router.use(protect);

router.post('/', [
  body('shippingAddress.fullName').notEmpty().withMessage('Full name required'),
  body('shippingAddress.phone').notEmpty().withMessage('Phone required'),
  body('shippingAddress.street').notEmpty().withMessage('Street required'),
  body('shippingAddress.city').notEmpty().withMessage('City required'),
  body('shippingAddress.state').notEmpty().withMessage('State required'),
  body('shippingAddress.postalCode').notEmpty().withMessage('Postal code required'),
  body('paymentMethod').isIn(['stripe', 'razorpay', 'cod']).withMessage('Valid payment method required'),
  validate,
], createOrder);

router.get('/', getMyOrders);
router.get('/:id', getOrderById);
router.post('/:id/cancel', cancelOrder);

// Admin routes
router.get('/admin/all', adminOnly, getAllOrders);
router.patch('/:id/status', adminOnly, [
  body('status').isIn(['pending','confirmed','processing','shipped','delivered','cancelled','returned'])
    .withMessage('Valid status required'),
  validate,
], updateOrderStatus);

module.exports = router;
