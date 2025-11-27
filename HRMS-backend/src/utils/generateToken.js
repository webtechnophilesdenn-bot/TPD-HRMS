const jwt = require('jsonwebtoken');

exports.generateToken = (userId, expiresIn = '7d') => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};
