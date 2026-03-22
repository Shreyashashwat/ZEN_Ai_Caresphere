import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../model/user.model.js";
import Doctor from "../model/doctor.js"; // Import Doctor model

export const verifyJwt = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "Unauthorized: No token provided");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 1. Determine which model to use based on the role in the token
    let user = null;

    if (decoded.role === "doctor") {
      // Search in Doctor collection
      user = await Doctor.findById(decoded._id).select("-password");
    } else {
      // Search in User (Patient) collection
      user = await User.findById(decoded._id).select("-password");
    }

    if (!user) {
      throw new ApiError(401, "Invalid token user: Account not found");
    }

    req.user = user; 
    next();
  } catch (error) {
    // Pass error to the global error handler
    next(new ApiError(401, error.message || "Invalid or expired token"));
  }
};

export const doctorOnly = (req, res, next) => {
  // Now that req.user is populated correctly from the DB, 
  // this check will work perfectly.
  if (req.user?.role !== "doctor") {
    return res.status(403).json({ message: "Doctor access only" });
  }
  next();
};