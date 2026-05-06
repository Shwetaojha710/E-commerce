const Product = require('../models/Product.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { deleteImage } = require('../config/cloudinary');

// GET /api/v1/products
const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    sort = '-createdAt',
    category,
    search,
    minPrice,
    maxPrice,
    brand,
    rating,
    inStock,
    isFeatured,
    isTrending,
  } = req.query;

  const query = { isActive: true };

  if (category) query.category = category;
  if (brand) query.brand = { $regex: brand, $options: 'i' };
  if (isFeatured === 'true') query.isFeatured = true;
  if (isTrending === 'true') query.isTrending = true;
  if (inStock === 'true') query.stock = { $gt: 0 };
  if (rating) query['ratings.average'] = { $gte: parseFloat(rating) };

  if (minPrice || maxPrice) {
    query.$or = [
      {
        discountPrice: {
          ...(minPrice && { $gte: parseFloat(minPrice) }),
          ...(maxPrice && { $lte: parseFloat(maxPrice) }),
        },
      },
      {
        price: {
          ...(minPrice && { $gte: parseFloat(minPrice) }),
          ...(maxPrice && { $lte: parseFloat(maxPrice) }),
        },
        discountPrice: { $exists: false },
      },
    ];
  }

  if (search) {
    query.$text = { $search: search };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Product.countDocuments(query),
  ]);

  return res.json(
    new ApiResponse(200, {
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    })
  );
});

// GET /api/v1/products/:slug
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug');

  if (!product) throw new ApiError(404, 'Product not found');

  // Track recently viewed
  if (req.user) {
    const User = require('../models/User.model');
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { recentlyViewed: { product: product._id } },
    });
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        recentlyViewed: {
          $each: [{ product: product._id, viewedAt: new Date() }],
          $position: 0,
          $slice: 20,
        },
      },
    });
  }

  // Related products
  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true,
  })
    .limit(6)
    .select('name slug images price discountPrice ratings')
    .lean();

  return res.json(new ApiResponse(200, { product, related }));
});

// POST /api/v1/products (admin)
const createProduct = asyncHandler(async (req, res) => {
  const images = (req.files || []).map((file) => ({
    url: file.path,
    publicId: file.filename,
    alt: req.body.name,
  }));

  const product = await Product.create({ ...req.body, images });

  return res.status(201).json(new ApiResponse(201, { product }, 'Product created successfully'));
});

// PUT /api/v1/products/:id (admin)
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (req.files?.length > 0) {
    const newImages = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
      alt: req.body.name || product.name,
    }));
    req.body.images = [...(product.images || []), ...newImages];
  }

  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  return res.json(new ApiResponse(200, { product: updated }, 'Product updated'));
});

// DELETE /api/v1/products/:id (admin)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  // Delete images from cloudinary
  for (const img of product.images) {
    if (img.publicId) await deleteImage(img.publicId).catch(() => {});
  }

  await product.deleteOne();

  return res.json(new ApiResponse(200, null, 'Product deleted'));
});

// DELETE /api/v1/products/:id/images/:publicId (admin)
const deleteProductImage = asyncHandler(async (req, res) => {
  const { id, publicId } = req.params;
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');

  await deleteImage(publicId);
  product.images = product.images.filter((img) => img.publicId !== publicId);
  await product.save();

  return res.json(new ApiResponse(200, { product }, 'Image deleted'));
});

// GET /api/v1/products/featured
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true, isActive: true })
    .populate('category', 'name slug')
    .limit(10)
    .lean();
  return res.json(new ApiResponse(200, { products }));
});

// GET /api/v1/products/trending
const getTrendingProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isTrending: true, isActive: true })
    .populate('category', 'name slug')
    .sort('-soldCount')
    .limit(10)
    .lean();
  return res.json(new ApiResponse(200, { products }));
});

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  getFeaturedProducts,
  getTrendingProducts,
};
