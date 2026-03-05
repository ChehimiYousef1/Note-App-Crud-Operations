const { MongoClient, Int32, Double, String } = require('mongodb'); // Correct import for BSON types

const mongoose = require('mongoose');

const connectDB = async () => {
    try{
        //get the mongodb uri from .env file
        const mongoURI = process.env.MONGO_URI;
        //check if exist or not exist
        if(!mongoURI) {
            throw new Error("MONGO_URI is not defined in .env");
        }

        //connect to MongoDB
        // Connect to MongoDB (no need for useNewUrlParser or useUnifiedTopology)
        await mongoose.connect(mongoURI);
        
        console.log(`✅ MongoDB connected successfully to database: ${mongoose.connection.name}`);
    }catch (err) {
         console.error("❌ MongoDB connection error:", err.message);
        process.exit(1); // Exit process with failure
    }
};

// Export the function to use in your main server file
module.exports = connectDB;