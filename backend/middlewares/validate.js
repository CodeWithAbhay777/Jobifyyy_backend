import { ApiError } from "../utils/ApiError.js";
import fs from 'fs';

export default (schema) => (req, _ , next) => {
  try {
    
    const result = schema.parse(req.body);
    req.body = result;
    next();
  } catch (err) {

    if (req.files && Array.isArray(req.files.profilePhoto) && req.files.profilePhoto.length > 0) {
        fs.unlinkSync(req.files.profilePhoto[0].path);
    }

    if (req.files && Array.isArray(req.files.resume) && req.files.resume.length > 0) {
        fs.unlinkSync(req.files.resume[0].path);
    }

    if (err && err.name === 'ZodError' && Array.isArray(err.issues) && err.issues.length > 0) {
      console.log("VALIDATION ERROR :::::::: ", err.issues[0].message);
        throw new ApiError(400, err.issues[0].message);
    }
    throw new ApiError(400, "Invalid request data");
  }
}; 