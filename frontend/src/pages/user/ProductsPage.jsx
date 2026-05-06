import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchProducts, setFilters, selectProducts } from '../../store/slices/productSlice';
import ProductCard from '../../components/product/ProductCard';
import ProductFilters from '../../components/product/ProductFilters';
import Pagination from '../../components/common/Pagination';
import SkeletonGrid from '../../components/common/SkeletonCard';

export default function ProductsPage() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { list, pagination, loading, filters } = useSelector(selectProducts);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const isFeatured = searchParams.get('isFeatured');
    const isTrending = searchParams.get('isTrending');
    const sort = searchParams.get('sort');

    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    if (isFeatured) params.isFeatured = isFeatured;
    if (isTrending) params.isTrending = isTrending;
    if (sort) params.sort = sort;

    if (Object.keys(params).length > 0) {
      dispatch(setFilters(params));
    }
  }, [searchParams]);

  useEffect(() => {
    dispatch(fetchProducts({
      ...filters,
      page: filters.page,
      limit: 12,
    }));
  }, [dispatch, filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar (desktop) */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="card p-5 sticky top-24">
            <h2 className="font-bold text-lg mb-5">Filters</h2>
            <ProductFilters />
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold">All Products</h1>
              {pagination && (
                <p className="text-sm text-gray-500 mt-0.5">{pagination.total} products found</p>
              )}
            </div>
            <button
              onClick={() => setFilterOpen(true)}
              className="lg:hidden btn-secondary text-sm py-2 px-4 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filters
            </button>
          </div>

          {loading ? (
            <SkeletonGrid count={12} />
          ) : list.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🔍</p>
              <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
              <p className="text-gray-500">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {list.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {pagination && (
            <Pagination
              currentPage={filters.page}
              totalPages={pagination.pages}
              onPageChange={(page) => dispatch(setFilters({ page }))}
            />
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {filterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setFilterOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-gray-900 z-50 p-6 overflow-y-auto lg:hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg">Filters</h2>
                <button onClick={() => setFilterOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ProductFilters onClose={() => setFilterOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
