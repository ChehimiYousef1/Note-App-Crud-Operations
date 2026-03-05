// migrations/runMigrations.js
const mongoose = require("mongoose");
const User = require("../src/models/Users");
const Note = require("../src/models/Note");

const runMigrations = async () => {
  try {
    console.log("🚀 Running migrations...");

    // Skip syncIndexes for serverless clusters (optional)
    // await User.syncIndexes();
    // await Note.syncIndexes();

    // Seed default admin if no users exist
    const count = await User.countDocuments();
    if (count === 0) {
      await User.create({
        userName: "admin",
        email: "chehimi030@gmail.com",
        password: "Admin@123", // will be hashed by pre-save
        role: "admin",
        dateOfBirth: new Date("2002-11-06"),
        gender: "male"
      });
      console.log("✅ Default admin user created");
    }

    console.log("✅ Migrations complete");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    // Optional: print stack if needed for debugging
    console.error(err.stack);
  }
};

module.exports = runMigrations;