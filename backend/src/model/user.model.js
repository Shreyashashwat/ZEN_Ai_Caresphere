import mongoose from "mongoose";
const { Schema } = mongoose;
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
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
  required: function () {
    return !this.hasGoogleAccount;
  },
},
hasGoogleAccount: {
  type: Boolean,
  default: false,
},

    //     age: {
    //         type: Number,
    //         required: true,
    //         min: 0,
    //         max: 120,
    //     },
    //     gender: {
    //         type: String,
    //         enum: ["Male", "Female", "Other"],
    //         required: true,
    //     // },


    // },
    age:{
        type:Number,
        required:true,
        min:0,
        max:120,
    },
    gender:{
        type:String,
        enum:["Male","Female","Other"],
        required:true,
    },
    fcmToken: {  
      type: String,
      default: null,
    },
    googleTokens: {
    access_token: { type: String },
    refresh_token: { type: String }, 
    expiry_date: { type: Number }
},
// hasGoogleAccount: {
//   type: Boolean,
//   default: false,
// },
    doctorCode: {
      type: String,
      required: true, 
      unique: true, 
      uppercase: true, 
      trim: true,
    },
     role:{
        type:String,
        default:"user",
    },
        age: {
            type: Number,
            required: true,
            min: 0,
            max: 120,
        },
        gender: {
            type: String,
            enum: ["Male", "Female", "Other"],
            required: true,
        },
        doctorCode: {
            type: String,
            default: null,
        },



        fcmToken: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateToken = function () {
    return jwt.sign(
        { id: this._id, email: this.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

export const User = mongoose.model("User", userSchema);

