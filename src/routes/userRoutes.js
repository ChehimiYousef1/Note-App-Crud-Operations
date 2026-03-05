const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/Users");
const { auth } = require("../middleware/auth");

// ─── Helper: Generate JWT Token ──────────────────────────────────────────────
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// ─── @route  POST /api/auth/register ─────────────────────────────────────────
// ─── @desc   Register a new user
// ─── @access Public
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account and returns a JWT token.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userName
 *               - email
 *               - password
 *             properties:
 *               userName:
 *                 type: string
 *                 example: Youssef123
 *               email:
 *                 type: string
 *                 example: youssef@email.com
 *               password:
 *                 type: string
 *                 example: Password123!
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: 2002-01-15
 *               gender:
 *                 type: string
 *                 example: male
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Validation error or duplicate email/username
 *       500:
 *         description: Server error
 */
router.post("/register", async (req, res) => {
  try {
    const { userName, email, password, dateOfBirth, gender } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { userName }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? "Email already in use." : "Username already taken.",
      });
    }

    const user = await User.create({ userName, email, password, dateOfBirth, gender, role: "user" });
    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: { id: user._id, userName: user.userName, email: user.email, role: user.role },
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
});

// ─── @route  POST /api/auth/login ────────────────────────────────────────────
// ─── @desc   Login and get JWT token
// ─── @access Public
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticates user and returns a JWT token.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: youssef@email.com
 *               password:
 *                 type: string
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Invalid email or password
 *       500:
 *         description: Server error
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid email or password" });

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000
    });

    res.json({ success: true, message: "Login successful", token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, status: "error", message: "Internal Server Error", details: err.message });
  }
});

// ─── @route  POST /api/auth/verify-token ────────────────────────────────
// ─── @desc   Verify a JWT token
// ─── @access Public
/**
 * @swagger
 * /api/auth/verify-token:
 *   post:
 *     summary: Verify a JWT token
 *     description: Sends a JWT token to the server to check if it is valid. Returns user info if valid.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token is valid."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "69a896c53ecf86813fbece16"
 *                     userName:
 *                       type: string
 *                       example: "Youssef123"
 *                     email:
 *                       type: string
 *                       example: "youssef@email.com"
 *                     role:
 *                       type: string
 *                       example: "user"
 *       400:
 *         description: No token provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No token provided."
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid or expired token."
 *                 error:
 *                   type: string
 *                   example: "jwt expired"
 *       404:
 *         description: User not found for the provided token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid token: user not found."
 *       500:
 *         description: Server error
 */
router.post("/verify-token", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "No token provided." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "Invalid token: user not found." });

    return res.status(200).json({ success: true, message: "Token is valid.", user });
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token.", error: err.message });
  }
});

// ─── @route  GET /api/auth/me ─────────────────────────────────────────────────
// ─── @desc   Get current logged-in user
// ─── @access Private
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current logged-in user
 *     description: Returns authenticated user details using JWT token.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         description: Unauthorized (Invalid or missing token)
 *       500:
 *         description: Server error
 */
router.get("/me", auth, async (req, res) => {
  return res.status(200).json({ success: true, user: req.user });
});

// ─── @route  POST /api/auth/logout ───────────────────────────────────────────
// ─── @desc   Logout (client should delete token)
// ─── @access Private
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logs out the authenticated user. Client must delete the JWT token.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/logout", (req, res) => {
  // Clear the auth_token cookie automatically
  res.clearCookie("auth_token", {
    httpOnly: true,                  // same as the login cookie
    secure: process.env.NODE_ENV === "production", 
    sameSite: "strict",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully. Token cleared automatically.",
  });
});
module.exports = router;