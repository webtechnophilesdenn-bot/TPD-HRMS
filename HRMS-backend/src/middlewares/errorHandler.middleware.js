const logger = require("../utils/logger");

module.exports = (err, req, res, next) => {
  // 1. Log the full error to the console (for quick debugging)
  // This helps if logger.error is the issue.
  console.error(err);

  // 2. Safely log the error using your custom logger
  // Check if err.message exists before logging.
  logger.error({
    message: err.message || "An unhandled error occurred",
    stack: err.stack,
    name: err.name,
    code: err.code,
  });

  // Start processing the error for the API response
  let error = { ...err };
  error.message = err.message;

  // --- Mongoose Error Handling (Keep this logic) ---

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    // If the error object itself is undefined (rare, but possible with some bad next() calls)
    // we need to make sure we don't try to access undefined properties.
    error.message = "Resource not found";
    error.statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    // If you want to make the message more specific:
    const value = err.errmsg && err.errmsg.match(/(["'])(\\?.)*?\1/);
    error.message = `Duplicate field value: ${
      value ? value[0] : "key"
    }. Please use another value.`;
    error.statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    error.message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    error.statusCode = 400;
  }

  // --- Final Response ---

  // Ensure the response always has a message, even if the error object was empty
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server Error. Contact Administrator.", // Better fallback message
  });
};
