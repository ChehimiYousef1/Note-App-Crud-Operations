const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { auth, isAdmin } = require("../middleware/auth");
const Note = require("../models/Note");

// ─── Ensure uploads folder exists ────────────────────────────────────────────
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ─── Multer setup ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// ─── @route  POST /api/admin/notes ───────────────────────────────────────────
// ─── @desc   Admin creates a note for any user
// ─── @access Admin only
/**
 * @swagger
 * /api/admin/notes:
 *   post:
 *     summary: Create a note (admin only)
 *     tags: [Admin Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - owner
 *               - startDate
 *               - dueDate
 *             properties:
 *               title:
 *                 type: string
 *                 example: Admin note
 *               content:
 *                 type: string
 *                 example: This note was created by admin
 *               owner:
 *                 type: string
 *                 description: User ID this note belongs to
 *                 example: 69a896c53ecf86813fbece16
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-03-01
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-03-31
 *               tags:
 *                 type: string
 *                 example: work,urgent
 *               color:
 *                 type: string
 *                 example: "#ffffff"
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Note created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admins only
 *       500:
 *         description: Server error
 */
router.post("/", auth, isAdmin, upload.array("attachments"), async (req, res) => {
  try {
    const { title, content, owner, startDate, dueDate, tags, color } = req.body;

    if (!title || !content || !owner || !startDate || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "title, content, owner, startDate and dueDate are required.",
      });
    }

    const attachments = req.files
      ? req.files.map((file) => ({
          filename: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
        }))
      : [];

    const note = await Note.create({
      title,
      content,
      owner,
      startDate,
      dueDate,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      color: color || "#ffffff",
      attachments,
    });

    return res.status(201).json({
      success: true,
      message: "Note created successfully.",
      note,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    return res.status(500).json({ success: false, message: "Server error.", details: err.message });
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
router.get("/", auth, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isArchived } = req.query;
    const filter = {};

    if (search) filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
    ];

    if (isArchived !== undefined) filter.isArchived = isArchived === "true";

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
    return res.status(500).json({ success: false, message: "Server error.", details: err.message });
  }
});

// ─── @route  PATCH /api/admin/notes/:id ──────────────────────────────────────
// ─── @desc   Admin updates any note
// ─── @access Admin only
/**
 * @swagger
 * /api/admin/notes/{id}:
 *   patch:
 *     summary: Update any note (admin only)
 *     tags: [Admin Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               tags:
 *                 type: string
 *               color:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               dueDate:
 *                 type: string
 *                 format: date
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Note updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admins only
 *       404:
 *         description: Note not found
 *       500:
 *         description: Server error
 */
router.patch("/:id", auth, isAdmin, upload.array("attachments"), async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found." });
    }

    const { title, content, tags, color, startDate, dueDate } = req.body;

    if (title) note.title = title;
    if (content) note.content = content;
    if (tags) note.tags = tags.split(",").map((t) => t.trim());
    if (color) note.color = color;
    if (startDate) note.startDate = startDate;
    if (dueDate) note.dueDate = dueDate;

    if (req.files?.length) {
      const newAttachments = req.files.map((file) => ({
        filename: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
      }));
      note.attachments.push(...newAttachments);
    }

    await note.save();

    return res.status(200).json({
      success: true,
      message: "Note updated successfully.",
      note,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error.", details: err.message });
  }
});

// ─── @route  DELETE /api/admin/notes/:id ─────────────────────────────────────
// ─── @desc   Admin hard deletes any note
// ─── @access Admin only
/**
 * @swagger
 * /api/admin/notes/{id}:
 *   delete:
 *     summary: Delete any note (admin only)
 *     tags: [Admin Notes]
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
 *         description: Note deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admins only
 *       404:
 *         description: Note not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", auth, isAdmin, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found." });
    }

    await note.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Note deleted successfully.",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error.", details: err.message });
  }
});

// ─── @route  PATCH /api/admin/notes/:id/archive ─────────────────────────────
// ─── @desc   Archive a note
// ─── @access Admin only
/**
 * @swagger
 * /api/admin/notes/{id}/archive:
 *   patch:
 *     summary: Archive a note (admin only)
 *     tags: [Admin Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Note ID to archive
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Note archived successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/archive", auth, isAdmin, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });

    note.isArchived = true;
    note.archivedAt = new Date();

    await note.save();

    res.status(200).json({ success: true, message: "Note archived successfully.", note });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error.", details: err.message });
  }
});

// ─── @route  PATCH /api/admin/notes/:id/unarchive ───────────────────────────
// ─── @desc   Unarchive a note
// ─── @access Admin only
/**
 * @swagger
 * /api/admin/notes/{id}/unarchive:
 *   patch:
 *     summary: Unarchive a note (admin only)
 *     tags: [Admin Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Note ID to unarchive
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Note unarchived successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/unarchive", auth, isAdmin, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });

    note.isArchived = false;
    note.archivedAt = null;

    await note.save();

    res.status(200).json({ success: true, message: "Note unarchived successfully.", note });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error.", details: err.message });
  }
});

// ─── @route  GET /api/admin/notes/archived ─────────────────────────────────
// ─── @desc   Get all archived notes
// ─── @access Admin only
/**
 * @swagger
 * /api/admin/notes/archived:
 *   get:
 *     summary: Get all archived notes
 *     tags: [Admin Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Archived notes retrieved successfully
 *       204:
 *         description: No archived notes found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/archived", auth, isAdmin, async (req, res) => {
  try {
    const archivedNotes = await Note.find({ isArchived: true })
      .populate("owner", "userName email role")
      .sort({ archivedAt: -1 });

    if (!archivedNotes.length) return res.status(204).json({ success: true, message: "No archived notes found." });

    res.status(200).json({ success: true, total: archivedNotes.length, notes: archivedNotes });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error.", details: err.message });
  }
});

// ─── @route  GET /api/admin/notes/non-archived ─────────────────────────────
// ─── @desc   Get all non-archived notes
// ─── @access Admin only
/**
 * @swagger
 * /api/admin/notes/non-archived:
 *   get:
 *     summary: Get all non-archived notes
 *     tags: [Admin Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Non-archived notes retrieved successfully
 *       204:
 *         description: No non-archived notes found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/non-archived", auth, isAdmin, async (req, res) => {
  try {
    const nonArchivedNotes = await Note.find({ isArchived: false })
      .populate("owner", "userName email role")
      .sort({ createdAt: -1 });

    if (!nonArchivedNotes.length) return res.status(204).json({ success: true, message: "No non-archived notes found." });

    res.status(200).json({ success: true, total: nonArchivedNotes.length, notes: nonArchivedNotes });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error.", details: err.message });
  }
});

module.exports = router;