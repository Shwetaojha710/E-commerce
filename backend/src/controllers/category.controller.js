const Category = require('../models/Category.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true, parent: null })
    .populate('subcategories')
    .sort('sortOrder')
    .lean();
  return res.json(new ApiResponse(200, { categories }));
});

const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true })
    .populate('subcategories');
  if (!category) throw new ApiError(404, 'Category not found');
  return res.json(new ApiResponse(200, { category }));
});

const createCategory = asyncHandler(async (req, res) => {
  const image = req.file
    ? { url: req.file.path, publicId: req.file.filename }
    : undefined;
  const category = await Category.create({ ...req.body, ...(image && { image }) });
  return res.status(201).json(new ApiResponse(201, { category }, 'Category created'));
});

const updateCategory = asyncHandler(async (req, res) => {
  if (req.file) {
    req.body.image = { url: req.file.path, publicId: req.file.filename };
  }
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) throw new ApiError(404, 'Category not found');
  return res.json(new ApiResponse(200, { category }, 'Category updated'));
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  return res.json(new ApiResponse(200, null, 'Category deleted'));
});

module.exports = { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory };
