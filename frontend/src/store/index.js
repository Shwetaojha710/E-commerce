import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, createTransform, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import { setupAxiosInterceptors } from '../api/axios';

import authReducer, { clearCredentials, refreshAccessToken } from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import wishlistReducer from './slices/wishlistSlice';
import themeReducer from './slices/themeSlice';
import productReducer from './slices/productSlice';
import orderReducer from './slices/orderSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  wishlist: wishlistReducer,
  theme: themeReducer,
  products: productReducer,
  orders: orderReducer,
});

const authPersistTransform = createTransform(
  (inboundState) => ({
    user: inboundState.user,
    accessToken: inboundState.accessToken,
    isAuthenticated: inboundState.isAuthenticated,
  }),
  (outboundState) => ({
    ...outboundState,
    loading: false,
    error: null,
  }),
  { whitelist: ['auth'] }
);

const persistConfig = {
  key: 'shopsphere',
  storage,
  whitelist: ['auth', 'theme'],
  transforms: [authPersistTransform],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

setupAxiosInterceptors(store, { refreshAccessToken, clearCredentials });
