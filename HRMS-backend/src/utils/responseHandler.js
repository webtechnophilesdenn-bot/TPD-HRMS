// exports.sendResponse = (res, statusCode, success, message, data = null) => {
//   const response = { success, message };
//   if (data) response.data = data;
//   return res.status(statusCode).json(response);
// };

/**
 * Standardized API response handler
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {Boolean} success - Success flag
 * @param {String} message - Response message
 * @param {Object|Array} data - Response data (optional)
 */
exports.sendResponse = (res, statusCode, success, message, data = null) => {
  const response = {
    success,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};
