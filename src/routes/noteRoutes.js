const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
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
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ─── @route  GET /api/notes ───────────────────────────────────────────────────
// ─── @desc   Get all notes for the logged-in user
// ─── @access Private
/**
 * @swagger
 * /api/notes:
 *   get:
 *     summary: Get all notes for the logged-in user
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Notes per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or content
 *     responses:
 *       200:
 *         description: Notes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: integer
 *                   example: 5
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 pages:
 *                   type: integer
 *                   example: 1
 *                 notes:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const filter = { owner: req.user.id, isArchived: false };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Note.countDocuments(filter);

    const notes = await Note.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      notes,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error.", details: err.message });
  }
});

// ─── @route  GET /api/notes/archived ─────────────────────────────────────────
// ─── @desc   Get all archived notes for the logged-in user
// ─── @access Private
/**
 * @swagger
 * /api/notes/archived:
 *   get:
 *     summary: Get all archived notes for the logged-in user
 *     tags: [Notes]
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
 *     responses:
 *       200:
 *         description: Archived notes retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/archived", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const filter = { owner: req.user.id, isArchived: true };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Note.countDocuments(filter);

    const notes = await Note.find(filter)
      .sort({ archivedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      notes,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error.", details: err.message });
  }
});

// ─── @route  GET /api/notes/:id ───────────────────────────────────────────────
// ─── @desc   Get a single note by ID
// ─── @access Private (owner only)
/**
 * @swagger
 * /api/notes/{id}:
 *   get:
 *     summary: Get a single note by ID
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Note retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 *       500:
 *         description: Server error
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user.id });
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });

    res.status(200).json({ success: true, note });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error.", details: err.message });
  }
});

// ─── @route  POST /api/notes ──────────────────────────────────────────────────
// ─── @desc   Create a new note
// ─── @access Private
/**
 * @swagger
 * /api/notes:
 *   post:
 *     summary: Create a new note
 *     tags: [Notes]
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
 *               - startDate
 *               - dueDate
 *             properties:
 *               title:
 *                 type: string
 *                 example: My note title
 *               content:
 *                 type: string
 *                 example: My note content
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
 *                 example: work,personal
 *                 description: Comma-separated tags
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
 *       500:
 *         description: Server error
 */
router.post("/", auth, upload.array("attachments"), async (req, res) => {
  try {
    const { title, content, startDate, dueDate, tags, color } = req.body;

    if (!title || !content || !startDate || !dueDate)
      return res.status(400).json({ success: false, message: "title, content, startDate and dueDate are required." });

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
      owner: req.user.id,
      startDate,
      dueDate,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      color: color || "#ffffff",
      attachments,
    });

    res.status(201).json({ success: true, message: "Note created successfully.", note });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error.", details: err.message });
  }
});

// ─── @route  PATCH /api/notes/:id ────────────────────────────────────────────
// ─── @desc   Update a note
// ─── @access Private (owner only)
/**
 * @swagger
 * /api/notes/{id}:
 *   patch:
 *     summary: Update a note
 *     tags: [Notes]
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
 *                 example: Updated title
 *               content:
 *                 type: string
 *                 example: Updated content
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
 *                 example: "#ffcc00"
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
 *       404:
 *         description: Note not found
 *       500:
 *         description: Server error
 */
router.patch("/:id", auth, upload.array("attachments"), async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user.id });
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });

    const { title, content, tags, color, startDate, dueDate } = req.body;

    if (title) note.title = title;
    if (content) note.content = content;
    if (tags) note.tags = tags.split(",").map((t) => t.trim());
    if (color) note.color = color;
    if (startDate) note.startDate = startDate;
    if (dueDate) note.dueDate = dueDate;

    if (!note.attachments) note.attachments = [];
    if (req.files?.length) {
      const newAttachments = req.files.map((file) => ({
        filename: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
      }));
      note.attachments.push(...newAttachments);
    }

    await note.save();
    res.status(200).json({ success: true, message: "Note updated successfully.", note });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error.", details: err.message });
  }
});

// ─── @route  DELETE /api/notes/:id ───────────────────────────────────────────
// ─── @desc   Delete a note
// ─── @access Private (owner only)
/**
 * @swagger
 * /api/notes/{id}:
 *   delete:
 *     summary: Delete a note
 *     tags: [Notes]
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
 *       404:
 *         description: Note not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user.id });
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });

    await note.deleteOne();
    res.status(200).json({ success: true, message: "Note deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error.", details: err.message });
  }
});

// ─── @route  PATCH /api/notes/:id/archive ────────────────────────────────────
// ─── @desc   Archive a note
// ─── @access Private (owner only)
/**
 * @swagger
 * /api/notes/{id}/archive:
 *   patch:
 *     summary: Archive a note
 *     tags: [Notes]
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
 *         description: Note archived successfully
 *       400:
 *         description: Note is already archived
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/archive", auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user.id });
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });

    if (note.isArchived)
      return res.status(400).json({ success: false, message: "Note is already archived." });

    note.isArchived = true;
    note.archivedAt = new Date();
    await note.save();

    res.status(200).json({ success: true, message: "Note archived successfully.", note });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error.", details: err.message });
  }
});

// ─── @route  PATCH /api/notes/:id/unarchive ──────────────────────────────────
// ─── @desc   Unarchive a note
// ─── @access Private (owner only)
/**
 * @swagger
 * /api/notes/{id}/unarchive:
 *   patch:
 *     summary: Unarchive a note
 *     tags: [Notes]
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
 *         description: Note unarchived successfully
 *       400:
 *         description: Note is not archived
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/unarchive", auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user.id });
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });

    if (!note.isArchived)
      return res.status(400).json({ success: false, message: "Note is not archived." });

    note.isArchived = false;
    note.archivedAt = null;
    await note.save();

    res.status(200).json({ success: true, message: "Note unarchived successfully.", note });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error.", details: err.message });
  }
});

// ─── @route  PATCH /api/notes/:id/pin ────────────────────────────────────────
// ─── @desc   Pin a note with a 4-digit PIN
// ─── @access Private (owner only)
/**
 * @swagger
 * /api/notes/{id}/pin:
 *   patch:
 *     summary: Pin a note with a 4-digit PIN
 *     tags: [Notes]
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
 *             required:
 *               - pin
 *               - confirmPin
 *             properties:
 *               pin:
 *                 type: string
 *                 example: "1234"
 *                 description: 4-digit PIN
 *               confirmPin:
 *                 type: string
 *                 example: "1234"
 *                 description: Must match pin
 *     responses:
 *       200:
 *         description: Note pinned successfully
 *       400:
 *         description: Invalid or non-matching PIN
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/pin", auth, async (req, res) => {
  try {
    const { pin, confirmPin } = req.body;

    if (!pin || !confirmPin || pin !== confirmPin || pin.length !== 4)
      return res.status(400).json({ success: false, message: "Invalid or non-matching PIN. Must be 4 digits." });

    const note = await Note.findOne({ _id: req.params.id, owner: req.user.id });
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });

    note.isPinned = true;
    note.pin = pin;
    await note.save();

    res.status(200).json({ success: true, message: "Note pinned successfully.", note });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error.", details: err.message });
  }
});

// ─── @route  PATCH /api/notes/:id/change-pin ─────────────────────────────────
// ─── @desc   Change PIN of a pinned note
// ─── @access Private (owner only)
/**
 * @swagger
 * /api/notes/{id}/change-pin:
 *   patch:
 *     summary: Change the PIN of a pinned note
 *     tags: [Notes]
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
 *             required:
 *               - pin
 *               - confirmPin
 *             properties:
 *               pin:
 *                 type: string
 *                 example: "5678"
 *                 description: New 4-digit PIN
 *               confirmPin:
 *                 type: string
 *                 example: "5678"
 *                 description: Must match new pin
 *     responses:
 *       200:
 *         description: PIN changed successfully
 *       400:
 *         description: Invalid PIN or note is not pinned
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/change-pin", auth, async (req, res) => {
  try {
    const { pin, confirmPin } = req.body;

    if (!pin || !confirmPin || pin !== confirmPin || pin.length !== 4)
      return res.status(400).json({ success: false, message: "Invalid or non-matching PIN. Must be 4 digits." });

    const note = await Note.findOne({ _id: req.params.id, owner: req.user.id });
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });

    if (!note.isPinned)
      return res.status(400).json({ success: false, message: "Note is not pinned." });

    note.pin = pin;
    await note.save();

    res.status(200).json({ success: true, message: "PIN changed successfully.", note });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error.", details: err.message });
  }
});

// ─── @route  PATCH /api/notes/:id/unpin ──────────────────────────────────────
// ─── @desc   Remove PIN from a note
// ─── @access Private (owner only)
/**
 * @swagger
 * /api/notes/{id}/unpin:
 *   patch:
 *     summary: Remove PIN from a note (unpin)
 *     tags: [Notes]
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
 *         description: Note unpinned successfully
 *       400:
 *         description: Note is not pinned
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/unpin", auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user.id });
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });

    if (!note.isPinned)
      return res.status(400).json({ success: false, message: "Note is not pinned." });

    note.isPinned = false;
    note.pin = null;
    await note.save();

    res.status(200).json({ success: true, message: "Note unpinned successfully.", note });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error.", details: err.message });
  }
});

module.exports = router;