import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { couponAPI } from '../../api/user.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const CouponModal = ({ coupon, onClose, onSave }) => {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    code: coupon?.code || '',
    description: coupon?.description || '',
    discountType: coupon?.discountType || 'percentage',
    discountValue: coupon?.discountValue || '',
    minOrderAmount: coupon?.minOrderAmount || 0,
    maxDiscountAmount: coupon?.maxDiscountAmount || '',
    usageLimit: coupon?.usageLimit || '',
    perUserLimit: coupon?.perUserLimit || 1,
    validFrom: coupon?.validFrom?.split('T')[0] || today,
    validUntil: coupon?.validUntil?.split('T')[0] || '',
    isActive: coupon?.isActive !== false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (coupon?._id) {
        await couponAPI.updateCoupon(coupon._id, form);
        toast.success('Coupon updated');
      } else {
        await couponAPI.createCoupon(form);
        toast.success('Coupon created');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="font-bold text-lg">{coupon ? 'Edit Coupon' : 'New Coupon'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Code *</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input uppercase" required />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Discount Type *</label>
            <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="input">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Discount Value *</label>
            <input type="number" min="0" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="input" required />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Min Order Amount</label>
            <input type="number" min="0" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} className="input" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Max Discount (₹)</label>
            <input type="number" min="0" value={form.maxDiscountAmount} onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })} className="input" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Usage Limit</label>
            <input type="number" min="1" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="Unlimited" className="input" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Valid From *</label>
            <input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} className="input" required />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Valid Until *</label>
            <input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} className="input" required />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium block mb-1">Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-primary-600" />
            <span className="text-sm">Active</span>
          </label>
          <div className="sm:col-span-2 flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Coupon'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await couponAPI.getCoupons();
      setCoupons(res.data.data?.coupons || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await couponAPI.deleteCoupon(id);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Coupons ({coupons.length})</h1>
        <button onClick={() => setModal({})} className="btn-primary text-sm">+ Add Coupon</button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {['Code', 'Discount', 'Min Order', 'Usage', 'Valid Until', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {coupons.map((coupon) => (
                <tr key={coupon._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-mono font-bold text-primary-600">{coupon.code}</td>
                  <td className="px-4 py-3">
                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                  </td>
                  <td className="px-4 py-3 text-gray-600">₹{coupon.minOrderAmount}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {coupon.usageCount}/{coupon.usageLimit || '∞'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {new Date(coupon.validUntil).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setModal(coupon)} className="text-xs btn-secondary py-1 px-3">Edit</button>
                      <button onClick={() => handleDelete(coupon._id)} className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 px-3 py-1 rounded-lg">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {coupons.length === 0 && <div className="text-center py-12 text-gray-400">No coupons found</div>}
        </div>
      )}

      {modal !== null && (
        <CouponModal
          coupon={Object.keys(modal).length > 0 ? modal : null}
          onClose={() => setModal(null)}
          onSave={fetchCoupons}
        />
      )}
    </div>
  );
}
