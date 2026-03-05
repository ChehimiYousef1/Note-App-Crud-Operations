const Note = require("../models/Note");

// ─── Check Note Ownership ────────────────────────────────────────────────────
// Allows access if: user owns the note OR user is admin
const noteOwner = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found.",
      });
    }

    // Admin can access any note
    if (req.user.role === "admin") {
      req.note = note; // attach note to request for reuse in controller
      return next();
    }

    // User can only access their own notes
    if (note.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not own this note.",
      });
    }

    // Attach note to request so controller doesn't need to fetch it again
    req.note = note;
    next();
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error while checking note ownership.",
    });
  }
};

module.exports = noteOwner;