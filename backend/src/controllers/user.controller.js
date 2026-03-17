import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../model/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from"jsonwebtoken";

const generateAcessNdRefreshToken=async(userId)=>{
    try {
        const user=await User.findById(userId);
        const AcessToken=user.generateAcessToken();
        const RefreshToken=user.generateRefreshToken();
        user.refreshToken=RefreshToken
        await user.save({validateBeforeSave:false})
        return {AcessToken,RefreshToken}
    } catch (error) {
        throw new ApiError(500,"Error while Generating Acess Token and Refresh Token")
    }
}
const registerUser=asyncHandler(async(req,res)=>{
    const {username,email,password,age,gender}=req.body;
    if(
        [username,email,password,age,gender].some((field)=>{
            return field?.trim() === "";
        })){
            throw new ApiError(400,"Field is missing")
        }
    if(email.includes("@")===false){
        throw new ApiError(400,"invalid email")
    } 
    const existed_user=await User.find({
        $or:[{username},{email}]
    })   
    if(existed_user.length()!=0){
        throw new ApiError(400,"The user is already Registered")
        
    }
    const user=await User.create({
        username,
        email,
        password,
        age,
        gender
    })
    const CreatedUser=await User.findById(user._id).select("-password -refreshedToken")
    if(!CreatedUser){
        throw new ApiError(500,"something went wrong")
    }
    return res.status(201).json(new ApiResponse(201,CreatedUser,"User is Registerd"))
})
const loginUser=asyncHandler(async(req,res)=>{
    const {email,password}=req.body;
    if(!email){
        throw new ApiError(400,"Email is required")
    }
    const user=await User.findby({
       email
    })
    if(!user){
        throw new ApiError(404,"User not found")
    }
    const isPasswordValid=await User.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Incorrect Password")
    }
    const {AcessToken,RefreshToken}=await generateAcessNdRefreshToken(user._id)
    const loggedInUser=await User.findById(user._id).select
     const option={
        httpOnly:true,
        secure:true
    }
    return res.status(200).cookie("accesstoken",AcessToken,option).cookie("refreshtoken",RefreshToken,option).json(new ApiResponse(200,{user:loggedInUser,AcessToken,RefreshToken},"Logged in Successfully"))
})
const loggOut=asyncHandler(async(req,res)=>{
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set:{
                     refreshToken:undefined
                },
            },
            {
                new:true
            }
        )
         const option={
        httpOnly:true,
        secure:true
    }
       return res.status(200).clearCookie("accesstoken",option).clearCookie("refreshtoken",option).json(new ApiResponse(200,{},"User logged out "))


    })
 const  refreshAcessToken=asyncHandler(async(req,res)=>{
    const CurrRefreshToken= req.cookies?.refreshToken || req.body.refreshToken
    if(!CurrRefreshToken){
        throw new ApiError(401,"Unauthorized Request")
    }
    try {
          const decodedRefreshToken=jwt.verify(CurrRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    const user=await User.findById(decodedRefreshToken?._id)
    if(!user){
        throw new ApiError(401,"Invalid Refresh token")
    }
    if(CurrRefreshToken != user?.refreshToken){
        throw new ApiError(401,"Invalid Refresh token")
    }
            const option={
        httpOnly:true,
        secure:true
    }
    const {accessToken,newResponseToken}=await generateAcessNdRefreshToken(user._id);
    return res.status(200).cookie("AccessToken",accessToken,option).cookie("newResponseToken",newResponseToken,option).json(new ApiResponse(200,{accessToken,newResponseToken},"AcessTokenRefreshed"))
    
        
    } catch (error) {
        throw new ApiError(400,"Something went wrong")
        
    }
  
})     












export {registerUser,
    loginUser,
   
}