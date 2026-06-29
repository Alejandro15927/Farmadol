const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'farmadol_secret_key_2024';

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = { verifyToken };