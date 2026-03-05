// src/utils/swaggerOptions.js
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Notes App Backend API",
      version: "1.0.0",
      description: `
Backend Task 3 – Notes App Backend
Developed by Youssef El Chehimi.

This API allows management of users and notes with the following features:

✅ User Management (registration, login, role-based access)  
✅ Notes Management (CRUD operations tied to users)  
✅ Each note references a user (Mongoose populate for relationships)  
✅ List all notes for a user or fetch a single note  
✅ Soft-delete or archive option for notes  
✅ JWT Authentication and protected routes  
✅ Clean API responses with proper error handling
      `,
      contact: {
        name: "Youssef El Chehimi",
        email: "chehimi030@gmail.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local Development Server",
      },
       {
        url: "https://note-app-crud-operations.onrender.com",
        description: "Deployed Render Server",
      },
    ],
  },
  apis: [
    "./src/routes/*.js",       // Path to your route files with JSDoc comments
    "./src/controllers/*.js",  // Optional: Path to controller files with JSDoc comments
  ],
};

module.exports = swaggerOptions;