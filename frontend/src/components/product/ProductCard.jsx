import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import {
  addToCartAsync,
  removeFromCartAsync,
  selectCartItems,
  updateCartItemAsync,
} from '../../store/slices/cartSlice';
import { toggleWishlistAsync } from '../../store/slices/wishlistSlice';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import { selectIsInWishlist } from '../../store/slices/wishlistSlice';
import StarRating from '../common/StarRating';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const inWishlist = useSelector(selectIsInWishlist(product._id));
  const cartItems = useSelector(selectCartItems);
  const cartItem = cartItems.find((item) => {
    const itemProductId = item.product?._id || item.product;
    return itemProductId === product._id;
  });

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }
    dispatch(addToCartAsync({ productId: product._id, quantity: 1 }));
  };

  const handleQuantityChange = (e, nextQuantity) => {
    e.preventDefault();
    if (!cartItem) return;

    if (nextQuantity <= 0) {
      dispatch(removeFromCartAsync(cartItem._id));
      return;
    }

    dispatch(updateCartItemAsync({ itemId: cartItem._id, quantity: nextQuantity }));
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to use wishlist');
      return;
    }
    dispatch(toggleWishlistAsync(product._id));
  };

  const discount = product.discountPercentage || (
    product.discountPrice
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : 0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="card overflow-hidden group cursor-pointer"
    >
      <Link to={`/products/${product.slug}`} className="block">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-800">
          <img
            src={product.images?.[0]?.url || 'https://placehold.co/400x400?text=No+Image'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {discount > 0 && (
            <span className="absolute top-2 left-2 badge bg-red-500 text-white">
              -{discount}%
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-gray-900 text-sm font-semibold px-3 py-1 rounded-lg">Out of Stock</span>
            </div>
          )}
          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md
              ${inWishlist
                ? 'bg-red-500 text-white'
                : 'bg-white/90 text-gray-600 hover:bg-red-500 hover:text-white'
              }`}
          >
            <svg className="w-4 h-4" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Details */}
        <div className="p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{product.brand}</p>
          <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-1 mb-3">
            <StarRating rating={product.ratings?.average || 0} />
            <span className="text-xs text-gray-500">({product.ratings?.count || 0})</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-bold text-gray-900 dark:text-white">
              ₹{(product.discountPrice || product.price).toLocaleString()}
            </span>
            {product.discountPrice && (
              <span className="text-sm text-gray-400 line-through">
                ₹{product.price.toLocaleString()}
              </span>
            )}
          </div>
          {cartItem ? (
            <div
              className="flex h-10 items-center justify-between overflow-hidden rounded-lg border border-primary-200 bg-primary-50 dark:border-primary-900/60 dark:bg-primary-900/20"
              onClick={(e) => e.preventDefault()}
            >
              <button
                type="button"
                onClick={(e) => handleQuantityChange(e, cartItem.quantity - 1)}
                className="h-full w-12 text-lg font-bold text-primary-700 transition-colors hover:bg-primary-100 dark:text-primary-300 dark:hover:bg-primary-900/40"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
                {cartItem.quantity}
              </span>
              <button
                type="button"
                onClick={(e) => handleQuantityChange(e, cartItem.quantity + 1)}
                disabled={cartItem.quantity >= 10 || cartItem.quantity >= product.stock}
                className="h-full w-12 text-lg font-bold text-primary-700 transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-primary-300 dark:hover:bg-primary-900/40"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="btn-primary w-full text-sm py-2 disabled:opacity-50"
            >
              Add to Cart
            </button>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
