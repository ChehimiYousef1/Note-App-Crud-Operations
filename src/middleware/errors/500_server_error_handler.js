// 500 Internal Server Error Handler
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  console.error("💥 ERROR:", err);

  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message:
      err.statusCode === 500
        ? "Internal Server Error"
        : err.message,
    details: err.details || null,
    timestamp: new Date().toISOString(),
  });
};

module.exports = errorHandler;