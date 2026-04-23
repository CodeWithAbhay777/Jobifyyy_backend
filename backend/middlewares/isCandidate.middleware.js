import UserModel from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const isCandidate = asyncHandler(async(req , res , next) => {
    const checkUser = await UserModel.findById(req.id);

    if (!checkUser) throw new ApiError(401 , "No user found");
    if (checkUser.role !== 'candidate') throw new ApiError(401 , "Only candidates are authorised for this.");

    next();

})