const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    // ─── Owner ───────────────────────────────────────────────────────────────
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Note must belong to a user"],
      index: true,
    },

    // ─── Content ─────────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, "Title is required"],
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title must not exceed 100 characters"],
      trim: true,
    },

    content: {
      type: String,
      required: [true, "Content is required"],
      maxlength: [10000, "Content must not exceed 10,000 characters"],
      trim: true,
    },

    // ─── Dates ───────────────────────────────────────────────────────────────
    startDate: {
      type: Date,
      default: null,
    },

    dueDate: {
      type: Date,
      default: null,
      validate: {
        validator: function (value) {
          if (!value || !this.startDate) return true; // skip if either missing
          return value >= this.startDate;
        },
        message: "Due date must be equal to or after start date",
      },
    },

    // ─── Attachments ─────────────────────────────────────────────────────────
    attachments: [
      {
        filename: { type: String, trim: true },
        path: { type: String, trim: true },
        mimetype: { type: String, trim: true },
      },
    ],

    // ─── Organization ────────────────────────────────────────────────────────
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags) => tags.length <= 10,
        message: "A note can have at most 10 tags",
      },
    },

    color: {
      type: String,
      default: "#ffffff",
      match: [/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex code"],
    },

    isPinned: {
      type: Boolean,
      default: false,
    },

    // ─── Soft Delete / Archive ────────────────────────────────────────────────
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },

    archivedAt: {
      type: Date,
      default: null,
    },
    pin: {
        type: String,
        default: null,
        select: false, // never returned in responses
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Indexes for performance ──────────────────────────────────────────────────
noteSchema.index({ owner: 1, isArchived: 1, createdAt: -1 });
noteSchema.index({ owner: 1, tags: 1 });

// ─── Clean API response ───────────────────────────────────────────────────────
noteSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Note", noteSchema);