import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

export const verifyJwt = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
  if (!token) throw new ApiError(401, "Unauthorized: No token provided");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded._id;
    console.log("Decoded token:", decoded);
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid or expired token");
  }
};