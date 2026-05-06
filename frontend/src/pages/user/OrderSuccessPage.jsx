import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchOrderById, selectOrders } from '../../store/slices/orderSlice';

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  const { current: order } = useSelector(selectOrders);

  useEffect(() => {
    if (orderId) dispatch(fetchOrderById(orderId));
  }, [dispatch, orderId]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="text-3xl font-extrabold text-green-600 mb-2">Order Placed!</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Thank you for your order. We'll send you a confirmation email shortly.
        </p>

        {order && (
          <div className="card p-6 text-left mb-8 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Order Number</span>
              <span className="font-bold text-primary-600">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Amount</span>
              <span className="font-bold">₹{order.totalAmount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment Method</span>
              <span className="font-medium capitalize">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Estimated Delivery</span>
              <span className="font-medium">
                {order.estimatedDelivery
                  ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '5-7 business days'}
              </span>
            </div>
            <div className="text-sm border-t pt-4 dark:border-gray-700">
              <p className="text-gray-500 mb-1">Delivering to:</p>
              <p className="font-medium">{order.shippingAddress?.fullName}</p>
              <p className="text-gray-600 dark:text-gray-400">
                {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={`/orders/${orderId}`} className="btn-primary px-8 py-3">
            Track Order
          </Link>
          <Link to="/products" className="btn-secondary px-8 py-3">
            Continue Shopping
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
