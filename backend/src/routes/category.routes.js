const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');
const {
  getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory,
} = require('../controllers/category.controller');

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'shopsphere/categories', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] },
});
const upload = multer({ storage }).single('image');

router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);
router.post('/', protect, adminOnly, upload, createCategory);
router.put('/:id', protect, adminOnly, upload, updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
