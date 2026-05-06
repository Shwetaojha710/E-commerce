import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilters, resetFilters, selectProducts } from '../../store/slices/productSlice';
import { categoryAPI } from '../../api/user.api';

export default function ProductFilters({ onClose }) {
  const dispatch = useDispatch();
  const { filters } = useSelector(selectProducts);
  const [categories, setCategories] = useState([]);
  const [local, setLocal] = useState(filters);

  useEffect(() => {
    categoryAPI.getCategories().then((res) => setCategories(res.data.data?.categories || []));
  }, []);

  const handleApply = () => {
    dispatch(setFilters(local));
    onClose?.();
  };

  const handleReset = () => {
    dispatch(resetFilters());
    setLocal({ category: '', search: '', minPrice: '', maxPrice: '', sort: '-createdAt', page: 1 });
    onClose?.();
  };

  const sortOptions = [
    { value: '-createdAt', label: 'Newest First' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: '-ratings.average', label: 'Top Rated' },
    { value: '-soldCount', label: 'Best Selling' },
  ];

  return (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <h3 className="font-semibold mb-3 text-sm">Sort By</h3>
        <select
          value={local.sort}
          onChange={(e) => setLocal({ ...local, sort: e.target.value })}
          className="input text-sm"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <h3 className="font-semibold mb-3 text-sm">Category</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="category"
              value=""
              checked={local.category === ''}
              onChange={(e) => setLocal({ ...local, category: e.target.value })}
              className="accent-primary-600"
            />
            <span className="text-sm">All Categories</span>
          </label>
          {categories.map((cat) => (
            <label key={cat._id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                value={cat._id}
                checked={local.category === cat._id}
                onChange={(e) => setLocal({ ...local, category: e.target.value })}
                className="accent-primary-600"
              />
              <span className="text-sm">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3 text-sm">Price Range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={local.minPrice}
            onChange={(e) => setLocal({ ...local, minPrice: e.target.value })}
            className="input text-sm"
            min="0"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            placeholder="Max"
            value={local.maxPrice}
            onChange={(e) => setLocal({ ...local, maxPrice: e.target.value })}
            className="input text-sm"
            min="0"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button onClick={handleReset} className="btn-secondary flex-1 text-sm py-2">Reset</button>
        <button onClick={handleApply} className="btn-primary flex-1 text-sm py-2">Apply</button>
      </div>
    </div>
  );
}
