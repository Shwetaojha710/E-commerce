import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { productAPI } from '../../api/product.api';
import { categoryAPI } from '../../api/user.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ProductModal = ({ product, categories, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    discountPrice: product?.discountPrice || '',
    category: product?.category?._id || product?.category || '',
    brand: product?.brand || '',
    stock: product?.stock || '',
    isFeatured: product?.isFeatured || false,
    isTrending: product?.isTrending || false,
    isActive: product?.isActive !== false,
    tags: product?.tags?.join(', ') || '',
    shortDescription: product?.shortDescription || '',
  });
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'tags') {
          v.split(',').map((t) => t.trim()).filter(Boolean).forEach((t) => formData.append('tags', t));
        } else {
          formData.append(k, v);
        }
      });
      images.forEach((img) => formData.append('images', img));

      if (product?._id) {
        await productAPI.updateProduct(product._id, formData);
        toast.success('Product updated');
      } else {
        await productAPI.createProduct(formData);
        toast.success('Product created');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="font-bold text-lg">{product ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium block mb-1">Product Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium block mb-1">Short Description</label>
            <input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium block mb-1">Description *</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input h-24 resize-none" required />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Price (₹) *</label>
            <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" required />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Discount Price (₹)</label>
            <input type="number" min="0" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} className="input" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Category *</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" required>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Brand</label>
            <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="input" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Stock *</label>
            <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input" required />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Tags (comma-separated)</label>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="input" placeholder="e.g. electronics, popular" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Images</label>
            <input type="file" multiple accept="image/*" onChange={(e) => setImages(Array.from(e.target.files))} className="input text-sm" />
          </div>
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="accent-primary-600" />
              <span className="text-sm">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isTrending} onChange={(e) => setForm({ ...form, isTrending: e.target.checked })} className="accent-primary-600" />
              <span className="text-sm">Trending</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-primary-600" />
              <span className="text-sm">Active</span>
            </label>
          </div>
          <div className="sm:col-span-2 flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Product'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getProducts({ page, limit: 15, ...(search && { search }) });
      setProducts(res.data.data?.products || []);
      setPagination(res.data.data?.pagination);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  useEffect(() => {
    categoryAPI.getCategories().then((res) => setCategories(res.data.data?.categories || []));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await productAPI.deleteProduct(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Products ({pagination?.total || 0})</h1>
        <button onClick={() => setModal({})} className="btn-primary text-sm">+ Add Product</button>
      </div>

      <div className="card p-4 mb-4">
        <input
          placeholder="Search products..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input text-sm max-w-sm"
        />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images?.[0]?.url}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded-lg"
                      />
                      <div>
                        <p className="font-medium line-clamp-1">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{product.category?.name}</td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-semibold">₹{(product.discountPrice || product.price).toLocaleString()}</span>
                      {product.discountPrice && (
                        <span className="text-xs text-gray-400 line-through ml-1">₹{product.price}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${product.stock > 5 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setModal(product)} className="text-xs btn-secondary py-1 px-3">Edit</button>
                      <button onClick={() => handleDelete(product._id)} className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="text-center py-12 text-gray-400">No products found</div>
          )}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium ${p === page ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {modal !== null && (
        <ProductModal
          product={Object.keys(modal).length > 0 ? modal : null}
          categories={categories}
          onClose={() => setModal(null)}
          onSave={fetchProducts}
        />
      )}
    </div>
  );
}
