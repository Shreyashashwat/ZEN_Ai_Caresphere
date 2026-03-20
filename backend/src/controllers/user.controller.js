import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../model/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const registerUser = asyncHandler(async (req, res) => {
  console.log("yes noo")
  const { username, email, password, age, gender } = req.body;

  if ([username, email, password, gender].some((field) => field?.trim() === "") || !age) {
    throw new ApiError(400, "All fields are required");
  }

  if (!email.includes("@")) {
    throw new ApiError(400, "Invalid email format");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(400, "User already registered");
  }

  const user = new User({ username, email, password, age, gender });
  await user.save();

  const createdUser = await User.findById(user._id).select("-password");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});


const loginUser = asyncHandler(async (req, res) => {
  console.log(" yes");
  const { email, password } = req.body;

  if (!email || !password) throw new ApiError(400, "Email and password are required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Incorrect password");

 
  const token = jwt.sign(
    { _id: user._id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" } 
  );
  console.log("hgffd");
  console.log("Generated Token:", token);

  const loggedInUser = await User.findById(user._id).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, { user: loggedInUser, token }, "Logged in successfully")
    );
});


const logOut = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export { registerUser, loginUser, logOut };