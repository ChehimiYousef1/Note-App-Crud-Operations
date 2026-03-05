const jwt = require("jsonwebtoken");
const User = require("../models/Users");

// ─── Verify JWT Token ───────────────────────────────────────────────────────
const auth = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    // 2. If no header, check cookies
    else if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    // 3. No token found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // 4. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Find user — remove isActive check since it's not in your schema
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is valid but user no longer exists.",
      });
    }

    // 6. Attach user to request
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again.",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid token.",
      error: err.message,
    });
  }
};

// ─── Admin Only ─────────────────────────────────────────────────────────────
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Admins only.",
  });
};

module.exports = { auth, isAdmin };