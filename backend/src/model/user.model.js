import  mongoose from "mongoose"
const {Schema}=mongoose
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema=new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,

    },
    password:{
         type:String,
         required:[true,"Password is required"],

    },
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

},{
    timestamps:true,
})
userSchema.pre("save", async function(next){
    if(this.isModified("password")){
        this.password= await bcrypt.hash(this.password,10)
    }
     next();
    
})
userSchema.methods.isPasswordCorrect=async function (password) {
    return await bcrypt.compare(password,this.password)
    
}

userSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
export const User=mongoose.model("User",userSchema)