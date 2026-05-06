const Review = require('../models/Review.model');
const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/v1/reviews/product/:productId
const getProductReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = '-createdAt', rating } = req.query;
  const query = { product: req.params.productId, isApproved: true };
  if (rating) query.rating = parseInt(rating);

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [reviews, total] = await Promise.all([
    Review.find(query)
      .populate('user', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Review.countDocuments(query),
  ]);

  // Rating breakdown
  const breakdown = await Review.aggregate([
    { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(req.params.productId), isApproved: true } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);

  return res.json(
    new ApiResponse(200, {
      reviews,
      breakdown,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    })
  );
});

// POST /api/v1/reviews
const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, title, comment } = req.body;

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) throw new ApiError(409, 'You have already reviewed this product');

  // Check verified purchase
  const hasPurchased = await Order.findOne({
    user: req.user._id,
    'items.product': productId,
    orderStatus: 'delivered',
  });

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    rating,
    title,
    comment,
    isVerifiedPurchase: !!hasPurchased,
  });

  await review.populate('user', 'name avatar');

  return res.status(201).json(new ApiResponse(201, { review }, 'Review submitted'));
});

// PUT /api/v1/reviews/:id
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
  if (!review) throw new ApiError(404, 'Review not found');

  const { rating, title, comment } = req.body;
  if (rating) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (comment) review.comment = comment;
  await review.save();

  return res.json(new ApiResponse(200, { review }, 'Review updated'));
});

// DELETE /api/v1/reviews/:id
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({
    _id: req.params.id,
    ...(req.user.role !== 'admin' && { user: req.user._id }),
  });
  if (!review) throw new ApiError(404, 'Review not found');

  await review.deleteOne();
  return res.json(new ApiResponse(200, null, 'Review deleted'));
});

// POST /api/v1/reviews/:id/helpful
const markHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');

  const idx = review.helpful.indexOf(req.user._id);
  if (idx > -1) {
    review.helpful.splice(idx, 1);
  } else {
    review.helpful.push(req.user._id);
  }
  await review.save();

  return res.json(new ApiResponse(200, { helpfulCount: review.helpful.length }));
});

module.exports = { getProductReviews, createReview, updateReview, deleteReview, markHelpful };
