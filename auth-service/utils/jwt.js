const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'farmadol_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = { generateToken, verifyToken };