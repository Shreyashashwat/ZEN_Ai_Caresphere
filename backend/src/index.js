import dotenv from 'dotenv';
import connectDB from './db/index.js'
import app from './app.js';
import { sendnoti } from './firebase/SendNotification.js';
dotenv.config({ path: './.env' });
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);

    // Attempt DB connection
    connectDB()
        .then(() => {
            console.log("MongoDB connected successfully");
            sendnoti();
        })
        .catch((err) => {
            console.log(`MongoDB connection failed: ${err}`);
        });
});