import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const doctorSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        specialization: {
            type: String,
            trim: true,
        },
        experience: {
            type: Number,
            default: 0
        },
        doctorCode: {
            type: String,
            unique: true,
        }
    },
    {
        timestamps: true,
    }
);

doctorSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

doctorSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

doctorSchema.methods.generateToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            role: "doctor"
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRY || "7d",
        }
    );
};

export const Doctor = mongoose.model("Doctor", doctorSchema);
