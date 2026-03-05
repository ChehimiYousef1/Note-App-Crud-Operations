// 400 Bad Request Handler
const AppError = require("../../utils/AppError");

const badRequestHandler = (err, req, res, next) => {
  if (err.statusCode === 400) {
    return res.status(400).json({
      success: false,
      status: "fail",
      message: err.message || "Bad Request",
      details: err.details || null,
      timestamp: new Date().toISOString(),
    });
  }
  next(err); // pass other errors to the global handler
};

module.exports = badRequestHandler;