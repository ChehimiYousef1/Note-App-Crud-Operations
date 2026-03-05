/**
 * Standard 201 Created Response Handler
 * 
 * @param {Object} res - Express response object
 * @param {Object} options
 * @param {string} options.message - Success message
 * @param {Object} options.data - The created resource object
 * @param {Object} options.meta - Optional metadata (pagination, etc.)
 */
const createdResponse = (res, { message = "Resource created successfully", data = null, meta = null } = {}) => {
  return res.status(201).json({
    success: true,
    status: "created",
    message,
    data,
    meta,
    timestamp: new Date().toISOString(),
  });
};

module.exports = createdResponse;