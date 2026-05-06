const Order = require('../models/Order.model');
const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');
const Coupon = require('../models/Coupon.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { sendOrderConfirmationEmail } = require('../utils/email');

const SHIPPING_THRESHOLD = 500;
const SHIPPING_COST = 50;
const TAX_RATE = 0.18;

// POST /api/v1/orders
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, couponCode } = req.body;

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) throw new ApiError(400, 'Cart is empty');

  // Validate stock
  for (const item of cart.items) {
    if (!item.product || !item.product.isActive) {
      throw new ApiError(400, `Product "${item.name}" is no longer available`);
    }
    if (item.product.stock < item.quantity) {
      throw new ApiError(400, `Insufficient stock for "${item.product.name}"`);
    }
  }

  const items = cart.items.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    image: item.product.images[0]?.url,
    price: item.price,
    quantity: item.quantity,
    variant: item.variant,
  }));

  const itemsPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingPrice = itemsPrice >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const taxPrice = Math.round(itemsPrice * TAX_RATE * 100) / 100;

  let couponDiscount = 0;
  if (couponCode || cart.couponCode) {
    const code = couponCode || cart.couponCode;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (coupon && coupon.isValid()) {
      couponDiscount = coupon.calculateDiscount(itemsPrice);
    }
  }

  const totalAmount = Math.max(0, itemsPrice + shippingPrice + taxPrice - couponDiscount);

  const order = await Order.create({
    user: req.user._id,
    items,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    taxPrice,
    couponCode: couponCode || cart.couponCode,
    couponDiscount,
    totalAmount,
    orderStatus: paymentMethod === 'cod' ? 'confirmed' : 'pending',
    paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
    statusHistory: [{ status: 'pending', note: 'Order placed' }],
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Deduct stock
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product._id, {
      $inc: { stock: -item.quantity, soldCount: item.quantity },
    });
  }

  // Mark coupon as used
  if (order.couponCode) {
    await Coupon.findOneAndUpdate(
      { code: order.couponCode },
      {
        $inc: { usageCount: 1 },
        $push: { usedBy: { user: req.user._id } },
      }
    );
  }

  // Clear cart
  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items: [], couponCode: null, couponDiscount: 0 }
  );

  // Send confirmation email
  try {
    await sendOrderConfirmationEmail(req.user, order);
  } catch (_) {}

  return res.status(201).json(new ApiResponse(201, { order }, 'Order placed successfully'));
});

// GET /api/v1/orders
const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Order.countDocuments({ user: req.user._id }),
  ]);

  return res.json(
    new ApiResponse(200, {
      orders,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    })
  );
});

// GET /api/v1/orders/:id
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).populate('items.product', 'name images slug');

  if (!order) throw new ApiError(404, 'Order not found');

  return res.json(new ApiResponse(200, { order }));
});

// POST /api/v1/orders/:id/cancel
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');

  if (!['pending', 'confirmed'].includes(order.orderStatus)) {
    throw new ApiError(400, 'Order cannot be cancelled at this stage');
  }

  order.orderStatus = 'cancelled';
  order.statusHistory.push({ status: 'cancelled', note: req.body.reason || 'Cancelled by user' });

  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity, soldCount: -item.quantity },
    });
  }

  await order.save();
  return res.json(new ApiResponse(200, { order }, 'Order cancelled'));
});

// Admin: GET /api/v1/orders/all
const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, paymentStatus } = req.query;
  const query = {};
  if (status) query.orderStatus = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Order.countDocuments(query),
  ]);

  return res.json(
    new ApiResponse(200, {
      orders,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    })
  );
});

// Admin: PATCH /api/v1/orders/:id/status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note, trackingNumber } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  order.orderStatus = status;
  order.statusHistory.push({ status, note });
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (status === 'delivered') order.deliveredAt = new Date();

  await order.save();
  return res.json(new ApiResponse(200, { order }, 'Order status updated'));
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
};
