import UserModel from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const isAdmin = asyncHandler(async(req , res , next) => {
    const checkUser = UserModel.findById(req.id);

    if (!checkUser) throw new ApiError(401 , "No user found");
    if (!checkUser.role === 'admin') throw new ApiError(401 , "Only admins are authorised for this.");

    next();

})