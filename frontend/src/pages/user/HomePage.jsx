import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchFeaturedProducts, fetchTrendingProducts, selectProducts } from '../../store/slices/productSlice';
import ProductCard from '../../components/product/ProductCard';
import { ProductCardSkeleton } from '../../components/common/SkeletonCard';

const HeroSection = () => (
  <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900 text-white overflow-hidden">
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
      <div className="max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="badge bg-white/20 text-white mb-4 py-1 px-3">🔥 New Arrivals</span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            Discover Your <span className="text-yellow-400">Perfect</span> Style
          </h1>
          <p className="text-lg text-primary-200 mb-8 leading-relaxed">
            Shop the latest trends with unbeatable prices. Premium quality, fast delivery, hassle-free returns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/products" className="btn-primary bg-yellow-400 text-gray-900 hover:bg-yellow-300 text-base px-8 py-3">
              Shop Now →
            </Link>
            <Link to="/products?isFeatured=true" className="btn-outline border-white text-white hover:bg-white hover:text-gray-900 text-base px-8 py-3">
              View Featured
            </Link>
          </div>
          <div className="flex items-center gap-8 mt-12 text-sm text-primary-200">
            {[
              { label: 'Free Shipping', desc: 'Orders over ₹500' },
              { label: 'Easy Returns', desc: '7-day policy' },
              { label: 'Secure Pay', desc: 'SSL encrypted' },
            ].map(({ label, desc }) => (
              <div key={label}>
                <p className="font-semibold text-white">{label}</p>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

const CategoryBanner = () => {
  const categories = [
    { name: 'Electronics', emoji: '💻', color: 'from-blue-500 to-cyan-500' },
    { name: 'Fashion', emoji: '👗', color: 'from-pink-500 to-rose-500' },
    { name: 'Home & Living', emoji: '🏠', color: 'from-green-500 to-emerald-500' },
    { name: 'Sports', emoji: '⚽', color: 'from-orange-500 to-amber-500' },
    { name: 'Books', emoji: '📚', color: 'from-purple-500 to-violet-500' },
    { name: 'Beauty', emoji: '💄', color: 'from-red-500 to-pink-500' },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-2xl font-bold mb-8">Shop by Category</h2>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {categories.map(({ name, emoji, color }) => (
          <Link
            key={name}
            to={`/products?search=${name}`}
            className={`bg-gradient-to-br ${color} text-white rounded-2xl p-4 text-center hover:scale-105 transition-transform cursor-pointer`}
          >
            <div className="text-3xl mb-2">{emoji}</div>
            <p className="text-xs font-semibold">{name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};

const PromoSection = () => (
  <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { title: 'Free Delivery', desc: 'On all orders above ₹500', emoji: '🚚', color: 'bg-blue-50 dark:bg-blue-900/20' },
        { title: 'Easy Returns', desc: 'Hassle-free 7-day returns', emoji: '↩️', color: 'bg-green-50 dark:bg-green-900/20' },
        { title: '24/7 Support', desc: 'Dedicated customer care', emoji: '💬', color: 'bg-purple-50 dark:bg-purple-900/20' },
      ].map(({ title, desc, emoji, color }) => (
        <div key={title} className={`${color} rounded-2xl p-6 flex items-center gap-4`}>
          <span className="text-3xl">{emoji}</span>
          <div>
            <h3 className="font-bold">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default function HomePage() {
  const dispatch = useDispatch();
  const { featured, trending, loading } = useSelector(selectProducts);

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    dispatch(fetchTrendingProducts());
  }, [dispatch]);

  return (
    <div>
      <HeroSection />
      <CategoryBanner />

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <p className="text-gray-500 text-sm mt-1">Hand-picked top selections</p>
          </div>
          <Link to="/products?isFeatured=true" className="text-primary-600 font-medium hover:underline text-sm">
            View All →
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featured.slice(0, 8).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Trending Section */}
      <section className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">🔥 Trending Now</h2>
              <p className="text-gray-500 text-sm mt-1">Most popular this week</p>
            </div>
            <Link to="/products?isTrending=true" className="text-primary-600 font-medium hover:underline text-sm">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {trending.slice(0, 8).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <PromoSection />
    </div>
  );
}
