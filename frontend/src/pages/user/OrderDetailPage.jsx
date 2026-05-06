import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderById, selectOrders } from '../../store/slices/orderSlice';
import { orderAPI } from '../../api/order.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current: order, loading } = useSelector(selectOrders);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    dispatch(fetchOrderById(id));
  }, [dispatch, id]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await orderAPI.cancelOrder(id, { reason: 'Cancelled by user' });
      dispatch(fetchOrderById(id));
      toast.success('Order cancelled successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!order) return <div className="text-center py-20"><p>Order not found</p></div>;

  const currentStep = STATUS_STEPS.indexOf(order.orderStatus);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/orders" className="text-primary-600 hover:underline text-sm mb-6 block">
        ← Back to Orders
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
          </p>
        </div>
        {['pending', 'confirmed'].includes(order.orderStatus) && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="text-sm bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div>

      {/* Tracking */}
      {!['cancelled', 'returned'].includes(order.orderStatus) && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold mb-4">Order Tracking</h2>
          <div className="flex items-center relative">
            {STATUS_STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 ${
                    i <= currentStep
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <span className="text-xs mt-1 text-center capitalize text-gray-600 dark:text-gray-400">{step}</span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`absolute h-1 top-4 ${i < currentStep ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                    style={{ left: `${(i + 0.5) * (100 / STATUS_STEPS.length)}%`, width: `${100 / STATUS_STEPS.length}%` }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          {order.trackingNumber && (
            <p className="text-sm text-gray-500 mt-4">Tracking: <span className="font-medium">{order.trackingNumber}</span></p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Items */}
        <div className="md:col-span-2 card p-6">
          <h2 className="font-semibold mb-4">Order Items ({order.items?.length})</h2>
          <div className="space-y-4">
            {order.items?.map((item) => (
              <div key={item._id} className="flex gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-xl"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  {item.variant && (
                    <p className="text-xs text-gray-500">
                      {item.variant.color} {item.variant.size}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                </div>
                <span className="font-semibold text-sm">₹{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t dark:border-gray-700 mt-4 pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Items Total</span>
              <span>₹{order.itemsPrice?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Shipping</span>
              <span>{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tax</span>
              <span>₹{order.taxPrice?.toFixed(2)}</span>
            </div>
            {order.couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Coupon ({order.couponCode})</span>
                <span>-₹{order.couponDiscount?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t dark:border-gray-700">
              <span>Total</span>
              <span>₹{order.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Delivery + Payment Info */}
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold mb-3 text-sm">Delivery Address</h3>
            <p className="text-sm font-medium">{order.shippingAddress?.fullName}</p>
            <p className="text-sm text-gray-500">{order.shippingAddress?.phone}</p>
            <p className="text-sm text-gray-500 mt-1">
              {order.shippingAddress?.street}, {order.shippingAddress?.city},
              {order.shippingAddress?.state} – {order.shippingAddress?.postalCode}
            </p>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold mb-3 text-sm">Payment Info</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="capitalize font-medium">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`badge capitalize ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
