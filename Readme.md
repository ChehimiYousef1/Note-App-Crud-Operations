# 📝 Notes App Backend API

![Node.js](https://img.shields.io/badge/Node.js-v24-green)
![Express](https://img.shields.io/badge/Express-4.x-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen)
![JWT](https://img.shields.io/badge/Auth-JWT-orange)
![Swagger](https://img.shields.io/badge/Docs-Swagger_UI-85EA2D)

> **Backend Task 3 – Notes Management System**  
> Version: `1.0.0` | OpenAPI Spec: `OAS 3.0`  
> Developed by **Youssef El Chehimi** — chehimi030@gmail.com

---

## 🚀 Project Overview

A **RESTful API backend** for a Notes Management System built with Node.js and Express.

Features include:

- ✅ User registration, login, and JWT authentication
- ✅ Role-based access control (user / admin)
- ✅ Full CRUD for notes with file attachments
- ✅ Archive / unarchive notes
- ✅ PIN lock / unlock notes
- ✅ Admin user and note management
- ✅ Interactive Swagger UI documentation

Developed as part of the **SyntecxHub Internship Program — Task 3**.

---

## 🛠 Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | JSON Web Token (JWT) |
| File Uploads | Multer |
| API Docs | Swagger UI + swagger-jsdoc |
| Security | Helmet, CORS, Cookie-parser |
| Logging | Morgan |

---

## 📂 Project Structure

```text
Note-App-Crud-Operations/
│
├── config/
│   └── db.js                        # MongoDB connection
│
├── migrations/
│   └── run_migration.js             # Seed default admin user
│
├── src/
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification + isAdmin check
│   │   ├── noteOwner.js             # Note ownership verification
│   │   └── errors/
│   │       ├── 400_bad_request_handler.js
│   │       ├── 404_error_handler.js
│   │       └── 500_server_error_handler.js
│   │
│   ├── models/
│   │   ├── Users.js                 # User schema
│   │   └── Note.js                  # Note schema
│   │
│   ├── routes/
│   │   ├── userRoutes.js            # Authentication routes
│   │   ├── noteRoutes.js            # User note routes
│   │   ├── admin_routes.js          # Admin user management
│   │   └── admin_notes_routes.js    # Admin note management
│   │
│   ├── utils/
│   │   └── swaggerOptions.js        # Swagger configuration
│   │
│   └── server.js                    # App entry point
│
├── uploads/                         # Stored file attachments
├── .env                             # Environment variables (not committed)
├── .env.example                     # Example env config
├── setup.sh                         # Auto-setup script
├── package.json
└── README.md
```

---

## ⚙️ Environment Setup

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/myDatabase?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
```

---

## 📦 Installation

### Option 1 — Manual

```bash
# 1. Clone the repository
git clone https://github.com/ChehimiYousef1/Note-App-Crud-Operations.git
cd Note-App-Crud-Operations

# 2. Install dependencies
npm install

# 3. Create uploads directory
mkdir -p uploads

# 4. Create your .env file (see above)
```

### Option 2 — Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

---

## ▶️ Running the Server

```bash
# Development (auto-reload with nodemon)
npm run dev

# Production
npm start
```

---

## 🌐 API Servers

| Environment | URL |
|-------------|-----|
| Local | `http://localhost:5000` |
| Production | `https://Note-Crud-Opereation-System-2jky.onrender.com` |

---

## 📚 Interactive API Documentation

```
http://localhost:5000/api-docs
```

Authorize by clicking 🔒 **Authorize** and entering: `Bearer <your_token>`

---

## 🔐 Authentication — `/api/auth`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Login and receive JWT token | Public |
| `POST` | `/api/auth/verify-token` | Check if a token is valid | Public |
| `GET` | `/api/auth/me` | Get currently logged-in user | Private |
| `POST` | `/api/auth/logout` | Logout and clear cookie | Private |

---

## 📝 User Notes — `/api/notes`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/notes` | Get all active notes | Private |
| `POST` | `/api/notes` | Create a new note | Private |
| `GET` | `/api/notes/archived` | Get all archived notes | Private |
| `GET` | `/api/notes/:id` | Get a specific note | Private |
| `PATCH` | `/api/notes/:id` | Update a note | Private |
| `DELETE` | `/api/notes/:id` | Delete a note | Private |
| `PATCH` | `/api/notes/:id/archive` | Archive a note | Private |
| `PATCH` | `/api/notes/:id/unarchive` | Unarchive a note | Private |
| `PATCH` | `/api/notes/:id/pin` | Pin a note with 4-digit PIN | Private |
| `PATCH` | `/api/notes/:id/change-pin` | Change note PIN | Private |
| `PATCH` | `/api/notes/:id/unpin` | Remove PIN from note | Private |

---

## 👨‍💼 Admin — User Management — `/api/admin`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/admin/users` | Get all users (paginated) | Admin |
| `GET` | `/api/admin/users/:id` | Get a user by ID | Admin |
| `DELETE` | `/api/admin/users/:id` | Delete user and all their notes | Admin |
| `PATCH` | `/api/admin/users/:id/role` | Change user role (user/admin) | Admin |
| `PATCH` | `/api/admin/users/:id/status` | Activate or deactivate user | Admin |

---

## 👨‍💼 Admin — Note Management — `/api/admin/notes`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/api/admin/notes` | Create a note for any user | Admin |
| `GET` | `/api/admin/notes` | Get all notes (all users) | Admin |
| `GET` | `/api/admin/notes/archived` | Get all archived notes | Admin |
| `GET` | `/api/admin/notes/non-archived` | Get all active notes | Admin |
| `PATCH` | `/api/admin/notes/:id` | Update any note | Admin |
| `PATCH` | `/api/admin/notes/:id/archive` | Archive any note | Admin |
| `PATCH` | `/api/admin/notes/:id/unarchive` | Unarchive any note | Admin |
| `DELETE` | `/api/admin/notes/:id` | Delete any note | Admin |

---

## 🔒 Authorization Flow

```
1. POST /api/auth/register  →  create account
2. POST /api/auth/login     →  receive JWT token
3. Add header to every protected request:
   Authorization: Bearer <your_token>
4. Middleware verifies token → attaches req.user
5. Role check:
   - user  → own notes only
   - admin → all notes and all users
```

---

## 📁 Note Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | ✅ | Note title (3–100 chars) |
| `content` | String | ✅ | Note body text |
| `startDate` | Date | ✅ | Start date |
| `dueDate` | Date | ✅ | Due date (must be ≥ startDate) |
| `tags` | Array | ❌ | Comma-separated tags |
| `color` | String | ❌ | Hex color (default: `#ffffff`) |
| `attachments` | Array | ❌ | Files (max 5MB each) |
| `isPinned` | Boolean | ❌ | Whether note is PIN-locked |
| `isArchived` | Boolean | ❌ | Whether note is archived |

---

## 🧠 Security Features

- ✅ JWT authentication with expiry
- ✅ Role-based route protection (user / admin)
- ✅ Password hashing with bcryptjs
- ✅ Secure HTTP headers via Helmet
- ✅ HttpOnly cookie support
- ✅ Input validation via Mongoose schema
- ✅ Ownership verification on all note operations

---

## 🧪 Default Admin Account

On first startup, a default admin account is seeded automatically:

```
Email:    chehimi030@gmail.com
Password: Admin@123
Role:     admin
```

> ⚠️ Change the password immediately in production.

---

## 📈 Future Enhancements

- [ ] User profile images
- [ ] Real-time notifications
- [ ] Rate limiting & brute-force protection
- [ ] Unit & integration tests
- [ ] CI/CD via GitHub Actions

---

## 📧 Contact

**Youssef El Chehimi** — Backend Developer  
✉️ chehimi030@gmail.com  
🐙 [github.com/ChehimiYousef1](https://github.com/ChehimiYousef1)

---

*Built with ❤️ for the SyntecxHub Internship Program*