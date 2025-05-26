import {asyncHanduler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from "../models/user.model.js"
import {updoadOnCloudinary} from '../utils/fileuploadCloudnary.js'
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from 'jsonwebtoken'
import { use } from 'react'

const generateAccessAndRefreshToken=async(userId)=>{
  try {
   const user= await User.findById(userId)
  const accessToken= user.generateAccessAndRefreshToken()
  const refreshToken= user.generateRefreshToken()

  user.refreshToken=refreshToken
  await user.save({validateBeforeSave:false})

  return {accessToken,refreshToken}
    
  } catch (error) {
    throw new ApiError(500,"something went wrong while generating refresh and access token")
  }
  
}

const registerUser=asyncHanduler( async (req,res)=>{
  //get user details from frontend
  //validation --not empty
  //chek if user already exists:y=username,email
  //chek for images,check for avatar
  //upload them to cloudnary,avatar
  //create user object-create entry in db
  // remove password and refresh token field from response
  //check for user  creation
  //return res

  const {fullname,email,username,password}=req.body
  console.log("email",email);
  if(
    [fullname,email,username,password].some((field)=>field?.trim()==="")
  ){
    throw new ApiError(400,"All field are required");
  }

  
  const existedUser=User.findOne({
    $or: [{username},{email}]
  })

  if(existedUser){
    throw new ApiError(409,"User already exist")
  }

  const avatarLocalPath=req.files?.avatar[0]?.path
  const coverImageLocalPath=req.files?.coverImage[0]?.path

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required")
  }

 const avatar= await updoadOnCloudinary(avatarLocalPath)
 const coverImagae=await updoadOnCloudinary(coverImageLocalPath)

 if(!avatar) {
  throw new ApiError(400,"Avatar file is required")
 }
 
 const user=await User.create({
  fullname,
  avatar:avatar.url,
  coverImagae:coverImagae?.url || "",
  email,
  password,
  username:username.toLowerCase()

 })

 const createdUser=await User.findById(user._id).select(
  "-password -refreshToken"
 )

 if(createdUser){
  throw new ApiError(500,"something went wrong while registering the user")
 }

 return res.this.status(201).json(
  new ApiResponse(200,createdUser,"user register successfully")
 )


})

const loginUser=asyncHanduler( async (req,res)=>{
  //req body->data
  //username or email
  //find the user
  //password check
  //access and refresh token
  //send cookie
  //response

  const {email,username,password}=req.body
  if(!email || !username) throw new ApiError(400,"username or password is required");

 const user= await User.findOne({
    $or:[{username},{email}]
  })

  if(!user) throw new ApiError(404,"User does not exist")

   const isPasswordValid= await user.isPasswordCorrect(password)

     if(!isPasswordValid) throw new ApiError(401,"password incorrect")

    const {accessToken,refreshToken}= await generateAccessAndRefreshToken(user._id)


const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

const options={
  httpOnly:true,
  secure:true
}
   return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
    new ApiResponse(200,{user:loggedInUser,accessToken,refreshToken},"user logged in successfully")
   )
  

})



const logoutUser=asyncHanduler(async(req,res)=>{
 await User.findByIdAndUpdate(
  req.user._id,
  {
    $set:{
      refreshToken:undefined
    }
  },{
    new:true
  }
 )
  const options={
    httpOnly:true,
    secure:true
  }
return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200,{},"user logged out "))
})

const refreshAccessToken=asyncHanduler(async(req,res)=>{
  const incomingRefreshToken= req.cookie.refreshToken || req.body.refreshToken
  if(incomingRefreshToken) throw new ApiError(400,"unauthorized request")

   try {
    const decodedToken= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
   const user=await User.findById(decodedToken?._id)
   if(!user) throw new ApiError(401,"Invalid refresh token")
 
     if(incomingRefreshToken !==user?.refreshToken) throw new ApiError(401,"refresh token is expired")
 
       const options={
         httpOnly:true,
         secure:true
       }
   const {accessToken,newRefreshToken}=  await  generateAccessAndRefreshToken(user._id)
 
     return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newRefreshToken,options).json(
       new ApiResponse(200,{accessToken,newRefreshToken},"Access token refreshed")
     )
     
   } catch (error) {
    throw new ApiError(401,error?.message || "invalid refresh token")
    
   }
})

export {registerUser,loginUser,logoutUser,refreshAccessToken}