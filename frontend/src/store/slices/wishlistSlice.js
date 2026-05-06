import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAPI } from '../../api/user.api';
import toast from 'react-hot-toast';

export const fetchWishlist = createAsyncThunk('wishlist/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await userAPI.getWishlist();
    return res.data.data?.wishlist;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const toggleWishlistAsync = createAsyncThunk('wishlist/toggle', async (productId, { rejectWithValue }) => {
  try {
    const res = await userAPI.toggleWishlist(productId);
    return { productId, inWishlist: res.data.data?.inWishlist, message: res.data.message };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.items = action.payload || [];
      })
      .addCase(toggleWishlistAsync.fulfilled, (state, action) => {
        const { productId, inWishlist, message } = action.payload;
        if (!inWishlist) {
          state.items = state.items.filter((item) => item._id !== productId);
        }
        toast.success(message);
      })
      .addCase(toggleWishlistAsync.rejected, (state, action) => {
        toast.error(action.payload || 'Failed to update wishlist');
      });
  },
});

export const selectWishlist = (state) => state.wishlist.items;
export const selectIsInWishlist = (productId) => (state) =>
  state.wishlist.items.some((item) => item._id === productId || item === productId);

export default wishlistSlice.reducer;
