// 404 Not Found Handler
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    status: "fail",
    message: `404 Not Found: ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
};

module.exports = notFoundHandler;