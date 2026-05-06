const router = require('express').Router();
const { protect, optionalAuth } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const { uploadProductImages } = require('../config/cloudinary');
const {
  getProducts, getProductBySlug, createProduct, updateProduct,
  deleteProduct, deleteProductImage, getFeaturedProducts, getTrendingProducts,
} = require('../controllers/product.controller');

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/trending', getTrendingProducts);
router.get('/:slug', optionalAuth, getProductBySlug);

router.post('/', protect, adminOnly, uploadProductImages, createProduct);
router.put('/:id', protect, adminOnly, uploadProductImages, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);
router.delete('/:id/images/:publicId', protect, adminOnly, deleteProductImage);

module.exports = router;
