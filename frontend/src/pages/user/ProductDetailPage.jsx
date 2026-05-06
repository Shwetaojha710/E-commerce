import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchProductBySlug, selectProducts } from '../../store/slices/productSlice';
import { addToCartAsync } from '../../store/slices/cartSlice';
import { toggleWishlistAsync, selectIsInWishlist } from '../../store/slices/wishlistSlice';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import { reviewAPI } from '../../api/user.api';
import StarRating from '../../components/common/StarRating';
import ProductCard from '../../components/product/ProductCard';
import { ProductDetailSkeleton } from '../../components/common/SkeletonCard';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { current: product, related, loading } = useSelector(selectProducts);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const inWishlist = useSelector(selectIsInWishlist(product?._id));
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    dispatch(fetchProductBySlug(slug));
    setSelectedImage(0);
    setSelectedVariant(null);
    setQuantity(1);
  }, [dispatch, slug]);

  useEffect(() => {
    if (product?._id) {
      reviewAPI.getProductReviews(product._id, { limit: 10 })
        .then((res) => setReviews(res.data.data?.reviews || []))
        .catch(() => {});
    }
  }, [product?._id]);

  const handleAddToCart = () => {
    if (!isAuthenticated) { toast.error('Please login to add to cart'); return; }
    dispatch(addToCartAsync({ productId: product._id, quantity, variant: selectedVariant }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login to write a review'); return; }
    setSubmittingReview(true);
    try {
      const res = await reviewAPI.createReview({
        productId: product._id,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviews([res.data.data?.review, ...reviews]);
      setReviewComment('');
      setReviewRating(5);
      toast.success('Review submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <ProductDetailSkeleton />;
  if (!product) return (
    <div className="text-center py-20">
      <p className="text-5xl mb-4">😕</p>
      <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
      <Link to="/products" className="btn-primary mt-4 inline-block">Browse Products</Link>
    </div>
  );

  const effectivePrice = product.discountPrice || product.price;
  const discount = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary-600">Products</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Images */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 mb-4">
            <motion.img
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={product.images?.[selectedImage]?.url || 'https://placehold.co/600x600?text=No+Image'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImage === i ? 'border-primary-600' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <p className="text-sm text-primary-600 font-medium mb-1">{product.brand}</p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <StarRating rating={product.ratings?.average} size="md" />
            <span className="text-sm text-gray-500">
              {product.ratings?.average?.toFixed(1)} ({product.ratings?.count} reviews)
            </span>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
              ₹{effectivePrice.toLocaleString()}
            </span>
            {product.discountPrice && (
              <>
                <span className="text-lg text-gray-400 line-through">₹{product.price.toLocaleString()}</span>
                <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {discount}% OFF
                </span>
              </>
            )}
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
            {product.shortDescription || product.description?.substring(0, 200)}
          </p>

          {/* Variants */}
          {product.variants?.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold mb-2">Select Variant</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                      selectedVariant === v
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-600'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-400'
                    }`}
                  >
                    {v.color && <span className="mr-1">{v.color}</span>}
                    {v.size && v.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Stock */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                −
              </button>
              <span className="w-10 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                +
              </button>
            </div>
            <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock > 5 ? '✓ In Stock' : product.stock > 0 ? `Only ${product.stock} left!` : '✗ Out of Stock'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="btn-primary flex-1 py-3 text-base disabled:opacity-50"
            >
              Add to Cart
            </button>
            <button
              onClick={() => dispatch(toggleWishlistAsync(product._id))}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 transition-all font-semibold
                ${inWishlist
                  ? 'border-red-400 bg-red-50 text-red-600 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-red-400 hover:text-red-500'
                }`}
            >
              <svg className="w-5 h-5" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {inWishlist ? 'Wishlisted' : 'Wishlist'}
            </button>
          </div>

          {/* Quick specs */}
          {product.specifications?.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                {product.specifications.slice(0, 4).map(({ key, value }) => (
                  <React.Fragment key={key}>
                    <span className="text-gray-500">{key}</span>
                    <span className="font-medium">{value}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-16">
        <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700 mb-8">
          {['description', 'specifications', 'reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab} {tab === 'reviews' && `(${reviews.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'description' && (
          <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {product.description}
          </div>
        )}

        {activeTab === 'specifications' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {product.specifications?.map(({ key, value }) => (
              <div key={key} className="flex gap-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 text-sm w-32 shrink-0">{key}</span>
                <span className="text-sm font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Write review */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Write a Review</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Rating</label>
                  <StarRating rating={reviewRating} size="lg" interactive onChange={setReviewRating} />
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  className="input resize-none h-24"
                  required
                  minLength={10}
                />
                <button type="submit" disabled={submittingReview} className="btn-primary">
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>

            {/* Reviews list */}
            {reviews.map((review) => (
              <div key={review._id} className="card p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-sm">
                      {review.user?.name?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{review.user?.name}</p>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} size="sm" />
                        {review.isVerifiedPurchase && (
                          <span className="badge bg-green-100 text-green-700 text-xs">Verified Purchase</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.title && <p className="font-medium text-sm mb-1">{review.title}</p>}
                <p className="text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
              </div>
            ))}

            {reviews.length === 0 && (
              <p className="text-center text-gray-500 py-8">No reviews yet. Be the first to review!</p>
            )}
          </div>
        )}
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
