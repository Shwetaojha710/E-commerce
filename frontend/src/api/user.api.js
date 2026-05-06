import api from './axios';

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  updateAvatar: (data) => api.put('/users/avatar', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getWishlist: () => api.get('/users/wishlist'),
  toggleWishlist: (productId) => api.post(`/users/wishlist/${productId}`),
  getRecentlyViewed: () => api.get('/users/recently-viewed'),
  getAllUsers: (params) => api.get('/users', { params }),
  toggleUserStatus: (id) => api.patch(`/users/${id}/toggle-status`),
};

export const addressAPI = {
  getAddresses: () => api.get('/addresses'),
  createAddress: (data) => api.post('/addresses', data),
  updateAddress: (id, data) => api.put(`/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/addresses/${id}`),
  setDefault: (id) => api.patch(`/addresses/${id}/default`),
};

export const categoryAPI = {
  getCategories: () => api.get('/categories'),
  getCategoryBySlug: (slug) => api.get(`/categories/${slug}`),
  createCategory: (data) => api.post('/categories', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

export const reviewAPI = {
  getProductReviews: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  createReview: (data) => api.post('/reviews', data),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
};

export const couponAPI = {
  getCoupons: () => api.get('/coupons'),
  createCoupon: (data) => api.post('/coupons', data),
  updateCoupon: (id, data) => api.put(`/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/coupons/${id}`),
  validateCoupon: (data) => api.post('/coupons/validate', data),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getSalesAnalytics: (params) => api.get('/admin/analytics/sales', { params }),
};

export const paymentAPI = {
  createStripeIntent: (data) => api.post('/payments/stripe/create-intent', data),
  confirmStripe: (data) => api.post('/payments/stripe/confirm', data),
  createRazorpayOrder: (data) => api.post('/payments/razorpay/create-order', data),
  verifyRazorpay: (data) => api.post('/payments/razorpay/verify', data),
};
