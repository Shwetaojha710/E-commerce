const User = require('../models/User.model');
const Product = require('../models/Product.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { deleteImage } = require('../config/cloudinary');

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-refreshTokens')
    .populate('wishlist', 'name slug images price discountPrice ratings')
    .populate('recentlyViewed.product', 'name slug images price discountPrice ratings');

  return res.json(new ApiResponse(200, { user }));
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { ...(name && { name }), ...(phone && { phone }) },
    { new: true, runValidators: true }
  ).select('-refreshTokens');

  return res.json(new ApiResponse(200, { user }, 'Profile updated'));
});

const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Please upload an image');

  const user = await User.findById(req.user._id);

  // Delete old avatar
  if (user.avatar?.publicId) {
    await deleteImage(user.avatar.publicId).catch(() => {});
  }

  user.avatar = { url: req.file.path, publicId: req.file.filename };
  await user.save({ validateBeforeSave: false });

  return res.json(new ApiResponse(200, { avatar: user.avatar }, 'Avatar updated'));
});

const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const user = await User.findById(req.user._id);
  const idx = user.wishlist.indexOf(productId);

  let message;
  if (idx > -1) {
    user.wishlist.splice(idx, 1);
    message = 'Removed from wishlist';
  } else {
    user.wishlist.push(productId);
    message = 'Added to wishlist';
  }
  await user.save({ validateBeforeSave: false });

  return res.json(new ApiResponse(200, { inWishlist: idx === -1 }, message));
});

const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('wishlist', 'name slug images price discountPrice ratings stock isActive');
  return res.json(new ApiResponse(200, { wishlist: user.wishlist }));
});

const getRecentlyViewed = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('recentlyViewed.product', 'name slug images price discountPrice ratings');
  const items = user.recentlyViewed
    .filter((rv) => rv.product)
    .slice(0, 10);
  return res.json(new ApiResponse(200, { recentlyViewed: items }));
});

// Admin: GET all users
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, role } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(query).select('-refreshTokens').sort('-createdAt').skip(skip).limit(parseInt(limit)),
    User.countDocuments(query),
  ]);

  return res.json(
    new ApiResponse(200, {
      users,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    })
  );
});

// Admin: toggle user active status
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(403, 'Cannot deactivate admin');

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  return res.json(new ApiResponse(200, { isActive: user.isActive }, `User ${user.isActive ? 'activated' : 'deactivated'}`));
});

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  toggleWishlist,
  getWishlist,
  getRecentlyViewed,
  getAllUsers,
  toggleUserStatus,
};
