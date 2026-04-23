import {v2 as cloudinary} from 'cloudinary';

import fs from "fs";
import path from "path";
import { no } from 'zod/v4/locales';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,    
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath, resourceType = "auto") => {
  try {
    if (!localFilePath) return null;

    const normalizedPath = path.resolve(localFilePath);

    const response = await cloudinary.uploader.upload(normalizedPath, {
      resource_type: resourceType,
      access_mode: "public",
      // invalidate: true,
    });

   
    console.log(localFilePath)
    fs.unlinkSync(localFilePath);
    
    return response.url;
  } catch (error) {
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    console.error("Error uploading to Cloudinary:", error.message);
    return null;
  }
};