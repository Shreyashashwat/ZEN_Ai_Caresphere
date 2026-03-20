import { Schema, model } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
const Doctor= new Schema(
  {
    username: {
      type: String, 
      required: true, 
      trim: true, 
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,

    },
    code: {
      type: String,
      required: true, 
      unique: true, 
      uppercase: true, 
      trim: true,
    },
    role:{
        type:String,
        default:"doctor",
    },
    password:{
         type:String,
         required:[true,"Password is required"],

    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

Doctor.pre("save", async function(next){
    if(this.isModified("password")){
        this.password=await bcrypt.hash(this.password,10)
    }
     next();
    
})
Doctor.methods.isPasswordCorrect=async function (password) {
    return await bcrypt.compare(password,this.password)
    
}

Doctor.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
export default model("Doctor", Doctor);