import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../model/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error while generating access and refresh tokens");
  }
};


const registerUser = asyncHandler(async (req, res) => {
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

  const user = await User.create({ username, email, password, age, gender });
  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    console.log(error)
    throw new ApiError(500, "Something went wrong while creating user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});



const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Incorrect password");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "Logged in successfully"));
});


const logOut = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: undefined } }, { new: true });

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});


const refreshAccessToken = asyncHandler(async (req, res) => {
  const currRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!currRefreshToken) throw new ApiError(401, "Unauthorized request");

  try {
    const decoded = jwt.verify(currRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded?._id);

    if (!user || currRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new ApiResponse(200, { accessToken, refreshToken }, "Access token refreshed"));
  } catch (error) {
    throw new ApiError(400, "Invalid or expired refresh token");
  }
});


export { registerUser, loginUser, logOut, refreshAccessToken };