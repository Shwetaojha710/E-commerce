import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createOrderAsync } from '../../store/slices/orderSlice';
import { fetchCart, selectCart } from '../../store/slices/cartSlice';
import { addressAPI, paymentAPI } from '../../api/user.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const SHIPPING_THRESHOLD = 500;
const SHIPPING_COST = 50;
const TAX_RATE = 0.18;

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal, couponCode, couponDiscount } = useSelector(selectCart);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [newAddress, setNewAddress] = useState({
    fullName: '', phone: '', street: '', city: '', state: '', postalCode: '',
  });
  const [showAddressForm, setShowAddressForm] = useState(false);

  useEffect(() => {
    dispatch(fetchCart());
    addressAPI.getAddresses().then((res) => {
      const addrs = res.data.data?.addresses || [];
      setAddresses(addrs);
      const def = addrs.find((a) => a.isDefault);
      if (def) setSelectedAddress(def._id);
    });
  }, [dispatch]);

  const shippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.max(0, subtotal + shippingCost + tax - couponDiscount);

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await addressAPI.createAddress(newAddress);
      const addr = res.data.data?.address;
      setAddresses([...addresses, addr]);
      setSelectedAddress(addr._id);
      setShowAddressForm(false);
      toast.success('Address saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    }
  };

  const handleRazorpayPayment = async (orderId) => {
    const res = await paymentAPI.createRazorpayOrder({ orderId });
    const { razorpayOrderId, amount, currency, keyId } = res.data.data;

    return new Promise((resolve, reject) => {
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'ShopSphere',
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            await paymentAPI.verifyRazorpay({ ...response, orderId });
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error('Please select a delivery address'); return; }
    if (items.length === 0) { toast.error('Your cart is empty'); return; }

    const address = addresses.find((a) => a._id === selectedAddress);
    if (!address) { toast.error('Invalid address'); return; }

    setLoading(true);
    try {
      const result = await dispatch(createOrderAsync({
        shippingAddress: address,
        paymentMethod,
        couponCode,
      }));

      if (createOrderAsync.fulfilled.match(result)) {
        const order = result.payload;

        if (paymentMethod === 'razorpay') {
          try {
            await handleRazorpayPayment(order._id);
          } catch (err) {
            toast.error('Payment failed or cancelled');
            setLoading(false);
            return;
          }
        }
        navigate(`/order-success/${order._id}`);
      }
    } catch (err) {
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <h2 className="text-xl font-bold mb-4">Nothing to checkout</h2>
        <button onClick={() => navigate('/products')} className="btn-primary">Browse Products</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Address + Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <div className="card p-6">
            <h2 className="font-bold text-lg mb-4">Delivery Address</h2>
            <div className="space-y-3 mb-4">
              {addresses.map((addr) => (
                <label key={addr._id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedAddress === addr._id
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                }`}>
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddress === addr._id}
                    onChange={() => setSelectedAddress(addr._id)}
                    className="mt-1 accent-primary-600"
                  />
                  <div>
                    <p className="font-semibold text-sm">{addr.fullName} · {addr.phone}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {addr.street}, {addr.city}, {addr.state} – {addr.postalCode}
                    </p>
                    <span className="badge bg-gray-100 dark:bg-gray-800 text-xs mt-1">{addr.type}</span>
                  </div>
                </label>
              ))}
            </div>

            {showAddressForm ? (
              <form onSubmit={handleSaveAddress} className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4 dark:border-gray-700">
                {[
                  { field: 'fullName', label: 'Full Name', cols: 2 },
                  { field: 'phone', label: 'Phone' },
                  { field: 'street', label: 'Street Address', cols: 2 },
                  { field: 'city', label: 'City' },
                  { field: 'state', label: 'State' },
                  { field: 'postalCode', label: 'Postal Code' },
                ].map(({ field, label, cols }) => (
                  <div key={field} className={cols === 2 ? 'sm:col-span-2' : ''}>
                    <label className="text-sm font-medium block mb-1">{label}</label>
                    <input
                      className="input text-sm"
                      required
                      value={newAddress[field]}
                      onChange={(e) => setNewAddress({ ...newAddress, [field]: e.target.value })}
                    />
                  </div>
                ))}
                <div className="sm:col-span-2 flex gap-3">
                  <button type="submit" className="btn-primary text-sm py-2 px-6">Save Address</button>
                  <button type="button" onClick={() => setShowAddressForm(false)} className="btn-secondary text-sm py-2 px-6">Cancel</button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddressForm(true)}
                className="text-sm text-primary-600 font-medium hover:underline flex items-center gap-1"
              >
                + Add New Address
              </button>
            )}
          </div>

          {/* Payment Method */}
          <div className="card p-6">
            <h2 className="font-bold text-lg mb-4">Payment Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'razorpay', label: 'Razorpay', desc: 'UPI / Cards / NetBanking', emoji: '💳' },
                { value: 'stripe', label: 'Stripe', desc: 'International cards', emoji: '🌐' },
                { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when received', emoji: '💵' },
              ].map(({ value, label, desc, emoji }) => (
                <label
                  key={value}
                  className={`flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === value
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={value}
                    checked={paymentMethod === value}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-2xl">{emoji}</span>
                  <span className="font-semibold text-sm">{label}</span>
                  <span className="text-xs text-gray-500">{desc}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24 space-y-4">
            <h2 className="font-bold text-lg">Order Summary</h2>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {items.map((item) => (
                <div key={item._id} className="flex gap-3 text-sm">
                  <img
                    src={item.image || item.product?.images?.[0]?.url}
                    alt={item.name}
                    className="w-10 h-10 object-cover rounded-lg shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{item.name}</p>
                    <p className="text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-medium shrink-0">₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm border-t pt-4 dark:border-gray-800">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                  {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax (18%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon</span>
                  <span>-₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t dark:border-gray-800">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Placing Order...
                </span>
              ) : (
                `Place Order · ₹${total.toFixed(2)}`
              )}
            </button>
            <p className="text-xs text-gray-500 text-center">
              🔒 Secure checkout · SSL encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
