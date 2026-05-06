import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productAPI } from '../../api/product.api';

export const fetchProducts = createAsyncThunk('products/fetch', async (params, { rejectWithValue }) => {
  try {
    const res = await productAPI.getProducts(params);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchProductBySlug = createAsyncThunk('products/fetchOne', async (slug, { rejectWithValue }) => {
  try {
    const res = await productAPI.getProductBySlug(slug);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchFeaturedProducts = createAsyncThunk('products/featured', async (_, { rejectWithValue }) => {
  try {
    const res = await productAPI.getFeatured();
    return res.data.data?.products;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchTrendingProducts = createAsyncThunk('products/trending', async (_, { rejectWithValue }) => {
  try {
    const res = await productAPI.getTrending();
    return res.data.data?.products;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const productSlice = createSlice({
  name: 'products',
  initialState: {
    list: [],
    current: null,
    related: [],
    featured: [],
    trending: [],
    pagination: null,
    loading: false,
    error: null,
    filters: {
      category: '',
      search: '',
      minPrice: '',
      maxPrice: '',
      sort: '-createdAt',
      page: 1,
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload, page: 1 };
    },
    setPage: (state, action) => {
      state.filters.page = action.payload;
    },
    resetFilters: (state) => {
      state.filters = { category: '', search: '', minPrice: '', maxPrice: '', sort: '-createdAt', page: 1 };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload?.products || [];
        state.pagination = action.payload?.pagination || null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProductBySlug.pending, (state) => { state.loading = true; })
      .addCase(fetchProductBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload?.product || null;
        state.related = action.payload?.related || [];
      })
      .addCase(fetchProductBySlug.rejected, (state) => { state.loading = false; })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.featured = action.payload || [];
      })
      .addCase(fetchTrendingProducts.fulfilled, (state, action) => {
        state.trending = action.payload || [];
      });
  },
});

export const { setFilters, setPage, resetFilters } = productSlice.actions;
export const selectProducts = (state) => state.products;
export default productSlice.reducer;
