import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.ACCESS_TOKEN_SECRET,
});

const updoadOnCloudinary = async (localfilePath) => {
  try {
    if (!localfilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localfilePath, {
      resource_type: "auto",
    });
    // file has been uploaded successfull
    fs.unlink(localfilePath)
    console.log("file uploaded successfully on cloudinary", response.url);

    return response;
  } catch (error) {
    fs.unlinkSync(localfilePath); //remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

export {updoadOnCloudinary}