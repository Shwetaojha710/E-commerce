const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const {
  getProductReviews, createReview, updateReview, deleteReview, markHelpful,
} = require('../controllers/review.controller');

router.get('/product/:productId', getProductReviews);

router.use(protect);
router.post('/', [
  body('productId').isMongoId().withMessage('Valid product ID required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('comment').isLength({ min: 10 }).withMessage('Review must be at least 10 characters'),
  validate,
], createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/helpful', markHelpful);

module.exports = router;
