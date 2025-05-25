import {asyncHanduler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from "../models/user.model.js"
import {updoadOnCloudinary} from '../utils/fileuploadCloudnary.js'
import {ApiResponse} from "../utils/ApiResponse.js"


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
export {registerUser}