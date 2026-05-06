import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { categoryAPI } from '../../api/user.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const CategoryModal = ({ category, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || '',
    isActive: category?.isActive !== false,
  });
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (image) formData.append('image', image);

      if (category?._id) {
        await categoryAPI.updateCategory(category._id, formData);
        toast.success('Category updated');
      } else {
        await categoryAPI.createCategory(formData);
        toast.success('Category created');
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
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md"
      >
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="font-bold text-lg">{category ? 'Edit Category' : 'New Category'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input h-20 resize-none" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Image</label>
            {category?.image?.url && (
              <img src={category.image.url} alt={category.name} className="w-20 h-20 object-cover rounded-xl mb-2" />
            )}
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0])} className="input text-sm" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-primary-600" />
            <span className="text-sm">Active</span>
          </label>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryAPI.getCategories();
      setCategories(res.data.data?.categories || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await categoryAPI.deleteCategory(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Categories ({categories.length})</h1>
        <button onClick={() => setModal({})} className="btn-primary text-sm">+ Add Category</button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat._id} className="card p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                {cat.image?.url ? (
                  <img src={cat.image.url} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🗂️</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{cat.name}</p>
                <p className="text-xs text-gray-500 truncate">{cat.description}</p>
                <span className={`badge text-xs mt-1 ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {cat.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => setModal(cat)} className="text-xs btn-secondary py-1 px-3">Edit</button>
                <button onClick={() => handleDelete(cat._id)} className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 px-3 py-1 rounded-lg">Delete</button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">No categories found</div>
          )}
        </div>
      )}

      {modal !== null && (
        <CategoryModal
          category={Object.keys(modal).length > 0 ? modal : null}
          onClose={() => setModal(null)}
          onSave={fetchCategories}
        />
      )}
    </div>
  );
}
