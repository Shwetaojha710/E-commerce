const jwt = require('jsonwebtoken');

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
};

const generateEmailVerificationToken = (userId) => {
  return jwt.sign({ id: userId, purpose: 'email_verification' }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
};

const generatePasswordResetToken = (userId) => {
  return jwt.sign({ id: userId, purpose: 'password_reset' }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

const setCookieToken = (res, token, name = 'refreshToken') => {
  res.cookie(name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  setCookieToken,
};
