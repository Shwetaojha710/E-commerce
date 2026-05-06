import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartAPI } from '../../api/cart.api';
import toast from 'react-hot-toast';

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await cartAPI.getCart();
    return res.data.data?.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const addToCartAsync = createAsyncThunk('cart/add', async (payload, { rejectWithValue }) => {
  try {
    const res = await cartAPI.addToCart(payload);
    return res.data.data?.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add to cart');
  }
});

export const updateCartItemAsync = createAsyncThunk('cart/update', async ({ itemId, quantity }, { rejectWithValue }) => {
  try {
    const res = await cartAPI.updateItem(itemId, { quantity });
    return res.data.data?.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const removeFromCartAsync = createAsyncThunk('cart/remove', async (itemId, { rejectWithValue }) => {
  try {
    const res = await cartAPI.removeItem(itemId);
    return res.data.data?.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const clearCartAsync = createAsyncThunk('cart/clear', async (_, { rejectWithValue }) => {
  try {
    await cartAPI.clearCart();
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const applyCouponAsync = createAsyncThunk('cart/coupon', async (couponCode, { rejectWithValue }) => {
  try {
    const res = await cartAPI.applyCoupon({ couponCode });
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Invalid coupon');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    subtotal: 0,
    totalItems: 0,
    couponCode: null,
    couponDiscount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearCart: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.totalItems = 0;
      state.couponCode = null;
      state.couponDiscount = 0;
    },
  },
  extraReducers: (builder) => {
    const setCartData = (state, action) => {
      if (action.payload) {
        state.items = action.payload.items || [];
        state.subtotal = action.payload.subtotal || 0;
        state.totalItems = action.payload.totalItems || 0;
        state.couponCode = action.payload.couponCode || null;
        state.couponDiscount = action.payload.couponDiscount || 0;
      }
      state.loading = false;
    };

    builder
      .addCase(fetchCart.pending, (state) => { state.loading = true; })
      .addCase(fetchCart.fulfilled, setCartData)
      .addCase(fetchCart.rejected, (state) => { state.loading = false; })

      .addCase(addToCartAsync.pending, (state) => { state.loading = true; })
      .addCase(addToCartAsync.fulfilled, (state, action) => {
        setCartData(state, action);
        toast.success('Added to cart!');
      })
      .addCase(addToCartAsync.rejected, (state, action) => {
        state.loading = false;
        toast.error(action.payload || 'Failed to add to cart');
      })

      .addCase(updateCartItemAsync.fulfilled, setCartData)
      .addCase(removeFromCartAsync.fulfilled, (state, action) => {
        setCartData(state, action);
        toast.success('Item removed');
      })
      .addCase(clearCartAsync.fulfilled, (state) => {
        state.items = [];
        state.subtotal = 0;
        state.totalItems = 0;
        state.couponCode = null;
        state.couponDiscount = 0;
      })
      .addCase(applyCouponAsync.fulfilled, (state, action) => {
        state.couponCode = action.payload?.couponCode;
        state.couponDiscount = action.payload?.discount || 0;
        toast.success(`Coupon applied! Saved ₹${action.payload?.discount}`);
      })
      .addCase(applyCouponAsync.rejected, (state, action) => {
        toast.error(action.payload);
      });
  },
});

export const { clearCart } = cartSlice.actions;

export const selectCart = (state) => state.cart;
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.totalItems;

export default cartSlice.reducer;
