import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../model/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import Doctor from "../model/doctor.js";

const registerUser = asyncHandler(async (req, res) => {
  // 1. Get role from body to determine logic flow
  const { username, email, password, age, gender, doctorCode, role } = req.body;

  // ==========================
  // LOGIC FOR DOCTOR REGISTRATION
  // ==========================
  if (role === "doctor") {
    // For doctor, 'doctorCode' from frontend maps to 'code' in Doctor Schema
    if ([username, email, password, doctorCode].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "All fields (Username, Email, Password, Code) are required for Doctors");
    }

    const existedDoctor = await Doctor.findOne({
      $or: [{ username }, { email }, { code: doctorCode }],
    });

    if (existedDoctor) {
      throw new ApiError(409, "Doctor with these credentials already exists");
    }

    const doctor = new Doctor({
      username,
      email,
      password,
      code: doctorCode, // Mapping frontend 'doctorCode' to Doctor schema 'code'
      role: "doctor"
    });
   console.log(doctor);
    await doctor.save();
    console.log("ijsc")
    // Remove password from response
    const createdDoctor = await Doctor.findById(doctor._id).select("-password");
    console.log("doctor created")
    return res.status(201).json(
      new ApiResponse(201, createdDoctor, "Doctor registered successfully")
    );
  } 
  
  // ==========================
  // LOGIC FOR PATIENT (USER) REGISTRATION
  // ==========================
  else {
    // Existing logic for Patient
    if ([username, email, password, gender, doctorCode].some((field) => field?.trim() === "") || !age) {
      throw new ApiError(400, "All fields are required");
    }

    if (!email.includes("@")) {
      throw new ApiError(400, "Invalid email format");
    }

    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existedUser) {
      throw new ApiError(409, "User already registered");
    }

    // Verify the doctorCode exists (optional but recommended validation)
    // const validDoctor = await Doctor.findOne({ code: doctorCode });
    // if (!validDoctor) throw new ApiError(400, "Invalid Doctor Code provided");

    const user = new User({ 
        username, 
        email, 
        password, 
        age, 
        gender, 
        doctorCode, // Patient stores the code of the doctor they are connecting to
        role: "user" 
    });
    
    await user.save();

    const createdUser = await User.findById(user._id).select("-password");

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while creating user");
    }

    return res.status(201).json(
      new ApiResponse(201, createdUser, "User registered successfully")
    );
  }
});
const registerUser1 = asyncHandler(async (req, res) => {
  console.log("yes noo")
  const { username, email, password, age, gender ,doctorCode} = req.body;

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

  const user = new User({ username, email, password, age, gender ,doctorCode});
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
  const { email, password, role } = req.body; // Added role here

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  let user;
  let modelType; // To track if it is User or Doctor for token generation

  // ==========================
  // DOCTOR LOGIN
  // ==========================
  if (role === "doctor") {
    user = await Doctor.findOne({ email });
    modelType = "doctor";
  } 
  // ==========================
  // PATIENT (USER) LOGIN
  // ==========================
  else {
    user = await User.findOne({ email });
    modelType = "user";
  }

  if (!user) {
    throw new ApiError(404, `${role === 'doctor' ? 'Doctor' : 'User'} not found`);
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect password");
  }

  // Generate Token (Payload now includes role)
  const token = jwt.sign(
    { 
      _id: user._id, 
      email: user.email, 
      username: user.username,
      role: modelType 
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  // Return user without password
  const loggedInUser = role === "doctor" 
    ? await Doctor.findById(user._id).select("-password")
    : await User.findById(user._id).select("-password");
console.log(loggedInUser);
  return res
    .status(200)
    .json(
      new ApiResponse(200, { user: loggedInUser, token }, `${role === 'doctor' ? 'Doctor' : 'User'} logged in successfully`)
    );
});
const loginUser1 = asyncHandler(async (req, res) => {
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
  // console.log("hgffd");
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



const connectToDoctor = asyncHandler(async (req, res) => {
  const { doctorCode } = req.body;
  const userId = req.user._id; // From verifyJWT middleware

  if (!doctorCode) throw new ApiError(400, "Doctor code is required");

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { doctorCode } },
    { new: true }
  ).select("-password");

  if (!user) throw new ApiError(404, "User not found");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Successfully connected to doctor"));
});

export { registerUser, loginUser, logOut,connectToDoctor };