const Coupon = require('../models/Coupon.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort('-createdAt').lean();
  return res.json(new ApiResponse(200, { coupons }));
});

const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  return res.status(201).json(new ApiResponse(201, { coupon }, 'Coupon created'));
});

const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  return res.json(new ApiResponse(200, { coupon }, 'Coupon updated'));
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  return res.json(new ApiResponse(200, null, 'Coupon deleted'));
});

const validateCoupon = asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });

  if (!coupon || !coupon.isValid()) throw new ApiError(400, 'Invalid or expired coupon');

  if (orderAmount < coupon.minOrderAmount) {
    throw new ApiError(400, `Minimum order amount of ₹${coupon.minOrderAmount} required`);
  }

  const userUsage = coupon.usedBy.filter(
    (u) => u.user.toString() === req.user._id.toString()
  ).length;
  if (userUsage >= coupon.perUserLimit) {
    throw new ApiError(400, 'Coupon usage limit reached for your account');
  }

  const discount = coupon.calculateDiscount(orderAmount);

  return res.json(
    new ApiResponse(200, {
      code: coupon.code,
      discount,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      description: coupon.description,
    }, 'Coupon is valid')
  );
});

module.exports = { getCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon };
