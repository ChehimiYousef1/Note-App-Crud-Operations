/**
 * Standardized success response for API
 * @param {object} res - Express response object
 * @param {object} options - Options for customizing response
 * @param {number} options.statusCode - HTTP status code (default: 200)
 * @param {string} options.message - Success message (default: "Request successful")
 * @param {any} options.data - Response data (default: null)
 * @param {object} options.meta - Optional metadata for pagination or extra info
 */
const successResponse = (res, options = {}) => {
  const {
    statusCode = 200,
    message = "Request successful",
    data = null,
    meta = null,
  } = options;

  const response = {
    success: true,
    status: "success",
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  // Include meta only if provided
  if (meta) response.meta = meta;

  return res.status(statusCode).json(response);
};

module.exports = successResponse;