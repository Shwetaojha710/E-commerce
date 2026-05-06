const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');
const Coupon = require('../models/Coupon.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id })
    .populate('items.product', 'name images price discountPrice stock isActive slug');

  if (!cart) {
    return res.json(new ApiResponse(200, { cart: { items: [], subtotal: 0, totalItems: 0 } }));
  }

  // Remove items for deleted/inactive products
  cart.items = cart.items.filter(
    (item) => item.product && item.product.isActive
  );
  await cart.save({ validateBeforeSave: false });

  return res.json(new ApiResponse(200, { cart }));
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, variant } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, 'Product not found');
  if (product.stock < 1) throw new ApiError(400, 'Product is out of stock');

  const effectivePrice = product.discountPrice || product.price;

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [{
        product: productId,
        quantity,
        variant,
        price: effectivePrice,
        name: product.name,
        image: product.images[0]?.url,
      }],
    });
  } else {
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        JSON.stringify(item.variant) === JSON.stringify(variant || {})
    );

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + parseInt(quantity);
      if (newQty > 10) throw new ApiError(400, 'Cannot add more than 10 of the same item');
      cart.items[existingIndex].quantity = newQty;
    } else {
      cart.items.push({
        product: productId,
        quantity: parseInt(quantity),
        variant,
        price: effectivePrice,
        name: product.name,
        image: product.images[0]?.url,
      });
    }
    await cart.save();
  }

  await cart.populate('items.product', 'name images price discountPrice stock isActive');
  return res.json(new ApiResponse(200, { cart }, 'Added to cart'));
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found');

  const item = cart.items.id(itemId);
  if (!item) throw new ApiError(404, 'Cart item not found');

  if (quantity <= 0) {
    cart.items.pull(itemId);
  } else {
    if (quantity > 10) throw new ApiError(400, 'Cannot add more than 10 of the same item');
    item.quantity = quantity;
  }

  await cart.save();
  await cart.populate('items.product', 'name images price discountPrice stock');
  return res.json(new ApiResponse(200, { cart }, 'Cart updated'));
});

const removeFromCart = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { items: { _id: itemId } } },
    { new: true }
  ).populate('items.product', 'name images price discountPrice stock');

  if (!cart) throw new ApiError(404, 'Cart not found');
  return res.json(new ApiResponse(200, { cart }, 'Item removed from cart'));
});

const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items: [], couponCode: null, couponDiscount: 0 }
  );
  return res.json(new ApiResponse(200, null, 'Cart cleared'));
});

const applyCoupon = asyncHandler(async (req, res) => {
  const { couponCode } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found');

  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
  if (!coupon || !coupon.isValid()) throw new ApiError(400, 'Invalid or expired coupon');

  const userUsage = coupon.usedBy.filter(
    (u) => u.user.toString() === req.user._id.toString()
  ).length;
  if (userUsage >= coupon.perUserLimit) {
    throw new ApiError(400, 'You have already used this coupon the maximum number of times');
  }

  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = coupon.calculateDiscount(subtotal);

  cart.couponCode = coupon.code;
  cart.couponDiscount = discount;
  await cart.save();

  return res.json(new ApiResponse(200, { discount, couponCode: coupon.code }, 'Coupon applied'));
});

const removeCoupon = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { couponCode: null, couponDiscount: 0 }
  );
  return res.json(new ApiResponse(200, null, 'Coupon removed'));
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart, applyCoupon, removeCoupon };
