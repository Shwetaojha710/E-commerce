const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    gateway: {
      type: String,
      enum: ['stripe', 'razorpay', 'cod'],
      required: true,
    },
    gatewayPaymentId: String,
    gatewayOrderId: String,
    gatewaySignature: String,
    status: {
      type: String,
      enum: ['initiated', 'pending', 'completed', 'failed', 'refunded'],
      default: 'initiated',
    },
    refundAmount: Number,
    refundId: String,
    refundedAt: Date,
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ gatewayPaymentId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
