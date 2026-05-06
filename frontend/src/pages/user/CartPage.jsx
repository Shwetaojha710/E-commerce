import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchCart, updateCartItemAsync, removeFromCartAsync, clearCartAsync,
  applyCouponAsync, selectCart,
} from '../../store/slices/cartSlice';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CartItem = ({ item }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleQuantityChange = async (qty) => {
    setLoading(true);
    await dispatch(updateCartItemAsync({ itemId: item._id, quantity: qty }));
    setLoading(false);
  };

  const handleRemove = () => dispatch(removeFromCartAsync(item._id));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="card p-4 flex gap-4"
    >
      <Link to={`/products/${item.product?.slug}`} className="shrink-0">
        <img
          src={item.product?.images?.[0]?.url || item.image || 'https://placehold.co/100x100?text=?'}
          alt={item.name}
          className="w-20 h-20 object-cover rounded-xl"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/products/${item.product?.slug}`} className="font-semibold text-sm hover:text-primary-600 line-clamp-2">
          {item.name}
        </Link>
        {item.variant && (
          <p className="text-xs text-gray-500 mt-0.5">
            {item.variant.color && `Color: ${item.variant.color}`}
            {item.variant.size && ` · Size: ${item.variant.size}`}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
              disabled={loading}
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-semibold">
              {loading ? '...' : item.quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={item.quantity >= 10 || loading}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-sm disabled:opacity-40"
            >
              +
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-bold">₹{(item.price * item.quantity).toLocaleString()}</span>
            <button
              onClick={handleRemove}
              className="text-red-400 hover:text-red-600 transition-colors p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { items, subtotal, couponDiscount, loading } = useSelector(selectCart);
  const [couponCode, setCouponCode] = useState('');

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchCart());
  }, [dispatch, isAuthenticated]);

  const SHIPPING_THRESHOLD = 500;
  const SHIPPING_COST = 50;
  const TAX_RATE = 0.18;

  const shippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : items.length > 0 ? SHIPPING_COST : 0;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.max(0, subtotal + shippingCost + tax - couponDiscount);

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      dispatch(applyCouponAsync(couponCode.trim().toUpperCase()));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <h2 className="text-2xl font-bold mb-3">Please Log In</h2>
        <p className="text-gray-500 mb-6">You need to be logged in to view your cart</p>
        <Link to="/login" className="btn-primary">Login to Continue</Link>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-6xl mb-4">🛒</p>
        <h2 className="text-2xl font-bold mb-3">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some products to get started</p>
        <Link to="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-8">Shopping Cart ({items.length} items)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <CartItem key={item._id} item={item} />
            ))}
          </AnimatePresence>
          <button
            onClick={() => dispatch(clearCartAsync())}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Clear Cart
          </button>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24 space-y-4">
            <h2 className="font-bold text-lg">Order Summary</h2>

            {/* Coupon */}
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Coupon code"
                className="input text-sm flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
              />
              <button onClick={handleApplyCoupon} className="btn-outline text-sm py-2 px-4">Apply</button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className={shippingCost === 0 ? 'text-green-600 font-medium' : ''}>
                  {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tax (18% GST)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span>−₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            {subtotal < SHIPPING_THRESHOLD && (
              <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                Add ₹{(SHIPPING_THRESHOLD - subtotal).toFixed(0)} more for free shipping!
              </p>
            )}

            <button
              onClick={() => navigate('/checkout')}
              className="btn-primary w-full py-3 text-base"
            >
              Proceed to Checkout →
            </button>

            <Link to="/products" className="block text-center text-sm text-primary-600 hover:underline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
