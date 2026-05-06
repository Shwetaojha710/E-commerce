const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const {
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  setCookieToken,
} = require('../utils/generateToken');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/email');

// POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(409, 'Email already registered');

  const user = await User.create({ name, email, password });

  const verificationToken = generateEmailVerificationToken(user._id);
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

  try {
    await sendWelcomeEmail(user, verificationUrl);
  } catch (_) {}

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens.push({ token: refreshToken });
  await user.save({ validateBeforeSave: false });

  setCookieToken(res, refreshToken);

  return res.status(201).json(
    new ApiResponse(201, {
      user: user.toSafeObject(),
      accessToken,
    }, 'Registration successful. Please verify your email.')
  );
});

// POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) throw new ApiError(403, 'Account deactivated. Contact support.');

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Keep max 5 refresh tokens per user
  if (user.refreshTokens.length >= 5) {
    user.refreshTokens = user.refreshTokens.slice(-4);
  }
  user.refreshTokens.push({ token: refreshToken });
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  setCookieToken(res, refreshToken);

  return res.json(
    new ApiResponse(200, {
      user: user.toSafeObject(),
      accessToken,
    }, 'Login successful')
  );
});

// POST /api/v1/auth/refresh-token
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, 'Refresh token not found');

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) throw new ApiError(401, 'User not found');

  const tokenExists = user.refreshTokens.some((t) => t.token === token);
  if (!tokenExists) throw new ApiError(401, 'Invalid refresh token');

  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  // Rotate refresh token
  user.refreshTokens = user.refreshTokens.filter((t) => t.token !== token);
  user.refreshTokens.push({ token: newRefreshToken });
  await user.save({ validateBeforeSave: false });

  setCookieToken(res, newRefreshToken);

  return res.json(new ApiResponse(200, { accessToken: newAccessToken }, 'Token refreshed'));
});

// POST /api/v1/auth/logout
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token && req.user) {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { refreshTokens: { token } },
    });
  }
  res.clearCookie('refreshToken');
  return res.json(new ApiResponse(200, null, 'Logged out successfully'));
});

// POST /api/v1/auth/verify-email
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (decoded.purpose !== 'email_verification') throw new ApiError(400, 'Invalid token');

  const user = await User.findByIdAndUpdate(
    decoded.id,
    { isEmailVerified: true },
    { new: true }
  );
  if (!user) throw new ApiError(404, 'User not found');

  return res.json(new ApiResponse(200, null, 'Email verified successfully'));
});

// POST /api/v1/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Don't reveal if user exists
  if (!user) {
    return res.json(new ApiResponse(200, null, 'If that email exists, a reset link has been sent.'));
  }

  const resetToken = generatePasswordResetToken(user._id);
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  await sendPasswordResetEmail(user, resetUrl);

  return res.json(new ApiResponse(200, null, 'Password reset email sent'));
});

// POST /api/v1/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (decoded.purpose !== 'password_reset') throw new ApiError(400, 'Invalid token');

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(404, 'User not found');

  user.password = password;
  user.refreshTokens = [];
  await user.save();

  res.clearCookie('refreshToken');
  return res.json(new ApiResponse(200, null, 'Password reset successfully. Please log in.'));
});

// POST /api/v1/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  return res.json(new ApiResponse(200, null, 'Password changed successfully'));
});

// GET /api/v1/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-refreshTokens');
  return res.json(new ApiResponse(200, { user }));
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
};
