import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { orderAPI } from '../../api/order.api';
import toast from 'react-hot-toast';

export const createOrderAsync = createAsyncThunk('orders/create', async (data, { rejectWithValue }) => {
  try {
    const res = await orderAPI.createOrder(data);
    return res.data.data?.order;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to place order');
  }
});

export const fetchMyOrders = createAsyncThunk('orders/fetchMy', async (params, { rejectWithValue }) => {
  try {
    const res = await orderAPI.getMyOrders(params);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchOrderById = createAsyncThunk('orders/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await orderAPI.getOrderById(id);
    return res.data.data?.order;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    list: [],
    current: null,
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createOrderAsync.pending, (state) => { state.loading = true; })
      .addCase(createOrderAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
        toast.success('Order placed successfully!');
      })
      .addCase(createOrderAsync.rejected, (state, action) => {
        state.loading = false;
        toast.error(action.payload);
      })
      .addCase(fetchMyOrders.pending, (state) => { state.loading = true; })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload?.orders || [];
        state.pagination = action.payload?.pagination || null;
      })
      .addCase(fetchMyOrders.rejected, (state) => { state.loading = false; })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.current = action.payload;
      });
  },
});

export const selectOrders = (state) => state.orders;
export default orderSlice.reducer;
