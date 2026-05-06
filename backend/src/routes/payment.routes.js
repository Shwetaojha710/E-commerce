const router = require('express').Router();
const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  createStripePaymentIntent, confirmStripePayment,
  createRazorpayOrder, verifyRazorpayPayment, stripeWebhook,
} = require('../controllers/payment.controller');

// Stripe webhook needs raw body
router.post('/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

router.use(protect);

router.post('/stripe/create-intent', createStripePaymentIntent);
router.post('/stripe/confirm', confirmStripePayment);
router.post('/razorpay/create-order', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);

module.exports = router;
