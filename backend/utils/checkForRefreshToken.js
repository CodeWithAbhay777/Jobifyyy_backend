import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";
import { generateAccessAndRefereshTokens } from "./generateTokens.js";
import { ApiError } from "./ApiError.js";
import { accessCookieOptions, refreshCookieOptions } from "./contants.js";

export const checkForRefreshToken = async (refreshToken, req, res, next) => {
    
  try {
    if (!refreshToken) {
      throw new ApiError(401, "Unauthorized request : No refresh token found");
    }
  
    const decodedRefresh = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  
    if (!decodedRefresh) {
      throw new ApiError(401, "Unauthorized request : Invalid refresh token");
    }
  
    const user = await UserModel.findById(decodedRefresh.userId);
  
    if (!user) {
      throw new ApiError(401, "Unauthorized request : User not found");
    }
  
    const requiredTokens = generateAccessAndRefereshTokens(user);
  
    if (!requiredTokens.success) {
      throw new ApiError(
        500,
        requiredTokens.message || "Failed to generate tokens"
      );
    }
  
    user.refreshToken = requiredTokens.refreshToken;
    const finalSavedUser = await user.save({
      validateBeforeSave: false,
      new: true,
    });
  
    if (!finalSavedUser) {
      throw new ApiError(500, "Failed to save user data");
    }
  
    res.cookie("jobify_access_token", requiredTokens.accessToken, accessCookieOptions)
    .cookie("jobify_refresh_token", requiredTokens.refreshToken, refreshCookieOptions);
  
    req.id = user._id;
  
    next();
  } catch (error) {
    
      throw new ApiError(401, error?.message || "Invalid access and refresh token");
  }
};


