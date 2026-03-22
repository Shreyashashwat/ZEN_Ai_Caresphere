import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

console.log("Attempting to connect to:", process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("Connected successfully");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Connection failed details:", err.message);
        process.exit(1);
    });
