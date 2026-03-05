class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);

    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";
    this.isOperational = true; // Used to distinguish trusted errors
    this.details = details; // Optional extra info (validation errors, etc.)
    this.timestamp = new Date().toISOString();

    // Remove constructor call from stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;