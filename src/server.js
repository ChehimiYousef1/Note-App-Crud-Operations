require("dotenv").config();

// Express and middleware
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

// Swagger
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

// Configs & Utilities
const connectDB = require("../config/db");
const runMigrations = require("../migrations/run_migration");

// Error Handlers
const notFoundHandler = require("./middleware/errors/404_error_handler");
const badRequestHandler = require("./middleware/errors/400_bad_request_handler");
const errorHandler = require("./middleware/errors/500_server_error_handler");

// Routes
const authRoutes = require("./routes/userRoutes");        // auth: register, login, me, logout
const noteRoutes = require("./routes/noteRoutes");        // user notes: own notes only
const adminRoutes = require("./routes/admin_routes");     // admin users: manage users
const adminNoteRoutes = require("./routes/admin_notes_routes"); // admin notes: all notes

const app = express();

// ======= GLOBAL MIDDLEWARES =======
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// ======= HOME ROUTE =======
app.get("/", (req, res) => {
  res.send("Welcome from developer Youssef El Chehimi to Notes App Backend API! Visit /api-docs for Swagger UI.");
});

// ======= ROUTES =======
app.use("/api/auth", authRoutes);            // POST /api/auth/register, /login, /logout | GET /api/auth/me
app.use("/api/notes", noteRoutes);           // CRUD for own notes
app.use("/api/admin", adminRoutes);          // admin user management
app.use("/api/admin/notes", adminNoteRoutes); // admin note management

// ======= SWAGGER UI =======
const swaggerOptions = require("./utils/swaggerOptions");
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ======= ERROR HANDLERS =======
app.use(notFoundHandler);
app.use(badRequestHandler);
app.use(errorHandler);

// ======= START SERVER =======
const startServer = async () => {
  try {
    await connectDB();
    await runMigrations();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📖 Swagger docs on http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
};

startServer();