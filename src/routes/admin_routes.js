const express = require("express");
const router = express.Router();
const User = require("../models/Users");
const Note = require("../models/Note");
const { auth, isAdmin } = require("../middleware/auth");

// All admin routes require auth + isAdmin
router.use(auth, isAdmin);

// ─── @route  GET /api/admin/users ────────────────────────────────────────────
// ─── @desc   Get all users with their note counts
// ─── @access Admin only
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users with their note counts
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by userName or email
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admins only
 *       500:
 *         description: Server error
 */
router.get("/users", async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(filter);

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      users,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─── @route  GET /api/admin/users/:id ────────────────────────────────────────
// ─── @desc   Get single user by ID
// ─── @access Admin only
/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get single user by ID
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admins only
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─── @route  DELETE /api/admin/users/:id ─────────────────────────────────────
// ─── @desc   Force delete any user and their notes
// ─── @access Admin only
/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user and all their notes
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User and notes deleted successfully
 *       400:
 *         description: Cannot delete own account
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admins only
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account.",
      });
    }

    await Note.deleteMany({ owner: user._id });
    await User.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "User and all their notes deleted successfully.",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─── @route  PATCH /api/admin/users/:id/role ─────────────────────────────────
// ─── @desc   Change user role (user ↔ admin)
// ─── @access Admin only
/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     summary: Change a user's role
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 example: admin
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Invalid role value
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admins only
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be either 'user' or 'admin'.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      message: `User role updated to '${role}'.`,
      user,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─── @route  PATCH /api/admin/users/:id/status ───────────────────────────────
// ─── @desc   Activate or deactivate a user
// ─── @access Admin only
/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   patch:
 *     summary: Activate or deactivate a user
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admins only
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.patch("/users/:id/status", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: user.isActive ? "User account activated." : "User account deactivated.",
      user,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─── @route  GET /api/admin/notes ────────────────────────────────────────────
// ─── @desc   Get all notes across all users
// ─── @access Admin only
/**
 * @swagger
 * /api/admin/notes:
 *   get:
 *     summary: Get all notes across all users
 *     tags: [Admin Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or content
 *       - in: query
 *         name: isArchived
 *         schema:
 *           type: boolean
 *         description: Filter by archived status
 *     responses:
 *       200:
 *         description: Notes retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admins only
 *       500:
 *         description: Server error
 */
router.get("/notes", async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isArchived } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    if (isArchived !== undefined) {
      filter.isArchived = isArchived === "true";
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Note.countDocuments(filter);

    const notes = await Note.find(filter)
      .populate("owner", "userName email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      notes,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;