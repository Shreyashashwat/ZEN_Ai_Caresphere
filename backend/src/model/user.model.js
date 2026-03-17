import  mongoose ,{Schema} from "mongoose"
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
        enum:["male","female","others"],
        required:true,
    },
     refreshToken:{
        type:String
    }

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
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};
userSchema.methods.generateAcessToken=function (){
    return jwt.sign(
        {
            _id:this._id,
            username:this.username,
            fullName:this.fullName,
            email:this.email

        },
        process.env.ACCESS_TOKEN_SECRET,
        {
           expiresIn: process.env.ACCESS_TOKEN_EXPIRY

 
        }
    )
}
userSchema.methods.generateRefreshToken=function (){
    return jwt.sign(
        {
            _id:this._id,
            

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
 
        }
    )
}
export const User=mongoose.model("User",userSchema)