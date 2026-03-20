

import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../model/user.model.js";

export const verifyJwt = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "Unauthorized: No token provided");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded._id).select("-password");

    if (!user) {
      throw new ApiError(401, "Invalid token user");
    }

    req.user = user; 
    next();
  } catch (error) {
    next(error);
  }
};

export const doctorOnly = (req, res, next) => {
  if (req.user?.role !== "doctor") {
    return res.status(403).json({ message: "Doctor access only" });
  }
  next();
};