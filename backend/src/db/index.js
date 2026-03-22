import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
    
    });

    console.log(
      `MongoDB connected!! Host: ${connection.connection.host}, Database: ${connection.connection.name}`
    );
  } catch (error) {
    console.error("MongoDB connection ERROR:", error);
    process.exit(1);
  }
};

export default connectDB;
