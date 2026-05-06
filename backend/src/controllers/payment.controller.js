const Stripe = require('stripe');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order.model');
const Payment = require('../models/Payment.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/v1/payments/stripe/create-intent
const createStripePaymentIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.paymentStatus === 'paid') throw new ApiError(400, 'Order already paid');

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.totalAmount * 100),
    currency: 'inr',
    metadata: { orderId: order._id.toString(), userId: req.user._id.toString() },
  });

  await Payment.create({
    order: order._id,
    user: req.user._id,
    amount: order.totalAmount,
    gateway: 'stripe',
    gatewayOrderId: paymentIntent.id,
    status: 'pending',
  });

  return res.json(
    new ApiResponse(200, { clientSecret: paymentIntent.client_secret }, 'Payment intent created')
  );
});

// POST /api/v1/payments/stripe/confirm
const confirmStripePayment = asyncHandler(async (req, res) => {
  const { paymentIntentId, orderId } = req.body;

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.status !== 'succeeded') {
    throw new ApiError(400, 'Payment not successful');
  }

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  order.paymentStatus = 'paid';
  order.orderStatus = 'confirmed';
  order.paymentDetails = {
    transactionId: paymentIntentId,
    paidAt: new Date(),
  };
  order.statusHistory.push({ status: 'confirmed', note: 'Payment received via Stripe' });
  await order.save();

  await Payment.findOneAndUpdate(
    { gatewayOrderId: paymentIntentId },
    { status: 'completed', gatewayPaymentId: paymentIntentId }
  );

  return res.json(new ApiResponse(200, { order }, 'Payment confirmed'));
});

// POST /api/v1/payments/razorpay/create-order
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(order.totalAmount * 100),
    currency: 'INR',
    receipt: order.orderNumber,
    notes: { orderId: order._id.toString() },
  });

  await Payment.create({
    order: order._id,
    user: req.user._id,
    amount: order.totalAmount,
    gateway: 'razorpay',
    gatewayOrderId: razorpayOrder.id,
    status: 'pending',
  });

  return res.json(
    new ApiResponse(200, {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  );
});

// POST /api/v1/payments/razorpay/verify
const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, 'Invalid payment signature');
  }

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  order.paymentStatus = 'paid';
  order.orderStatus = 'confirmed';
  order.paymentDetails = {
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    paidAt: new Date(),
  };
  order.statusHistory.push({ status: 'confirmed', note: 'Payment received via Razorpay' });
  await order.save();

  await Payment.findOneAndUpdate(
    { gatewayOrderId: razorpay_order_id },
    {
      status: 'completed',
      gatewayPaymentId: razorpay_payment_id,
      gatewaySignature: razorpay_signature,
    }
  );

  return res.json(new ApiResponse(200, { order }, 'Payment verified successfully'));
});

// POST /api/v1/payments/stripe/webhook
const stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new ApiError(400, `Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const orderId = pi.metadata.orderId;
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
      'paymentDetails.transactionId': pi.id,
      'paymentDetails.paidAt': new Date(),
      $push: { statusHistory: { status: 'confirmed', note: 'Stripe webhook confirmed' } },
    });
  }

  return res.json({ received: true });
});

module.exports = {
  createStripePaymentIntent,
  confirmStripePayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
  stripeWebhook,
};
