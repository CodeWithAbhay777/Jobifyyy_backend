import userModel from "../models/user.model.js";
import { generateAccessAndRefereshTokens } from "../utils/generateTokens.js";
import { accessCookieOptions, refreshCookieOptions } from "../utils/contants.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import UserModel from "../models/user.model.js";

export const register = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  if (
    !username ||
    !email ||
    !password ||
    !role ||
    (role !== "candidate" && role !== "recruiter")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  const user = await userModel.findOne({
    $or: [{ username: username }, { email: email }],
  });

  if (user) {
    throw new ApiError(400, "User already exists with this username or email");
  }

  const savedData = await userModel.create({
    username,
    email,
    password,
    role,
    isEmailVerified: false,
  });

  if (!savedData) {
    throw new ApiError(500, "Saving data: Something went wrong!");
  }

  const requiredTokens = generateAccessAndRefereshTokens(savedData);

  if (!requiredTokens.success) {
    throw new ApiError(
      500,
      requiredTokens.message || "Failed to generate tokens"
    );
  }

  savedData.refreshToken = requiredTokens?.refreshToken;

  const finalSavedUser = await savedData.save({
    validateBeforeSave: false,
    new: true,
  });

  if (!finalSavedUser) {
    throw new ApiError(500, "Failed to save user data");
  }

  const dataToSend = {
    _id: finalSavedUser._id,
    username: finalSavedUser.username,
    email: finalSavedUser.email,
    role: finalSavedUser.role,
    isEmailVerified: finalSavedUser.isEmailVerified,
    isProfileComplete: finalSavedUser.isProfileComplete,
    createdAt: finalSavedUser.createdAt,
  };

  // Set cookies and return response
  return res
    .status(201)
    .cookie("jobify_access_token", requiredTokens.accessToken, accessCookieOptions)
    .cookie("jobify_refresh_token", requiredTokens.refreshToken, refreshCookieOptions)
    .json(new ApiResponse(201, "User registered successfully", dataToSend));
});

export const login = asyncHandler(async (req, res) => {
  const { emailOrUsername, password, role } = req.body;

  if (!emailOrUsername || !password || !role) {
    throw new ApiError(400, "Required all fields");
  }

  let user;

  if (role === "candidate") {
    user = await userModel.findOne({
      $and: [
        {
          $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
        },
        { role: role },
      ],
    });
  }
  if (role === "recruiter" || role === "admin") {
    user = await userModel.findOne({
      $and: [
        {
          $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
        },
        {
          $or: [{ role : 'recruiter'} , { role : 'admin'}]
        }
        
        
      ],
    });
  }
  console.log(user);

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const requiredTokens = generateAccessAndRefereshTokens(user);

  if (!requiredTokens.success) {
    throw new ApiError(400, "Required all fields");
  }

  user.refreshToken = requiredTokens?.refreshToken;

  const finalSavedUser = await user.save({
    validateBeforeSave: false,
    new: true,
  });

  if (!finalSavedUser) {
    throw new ApiError(500, "Failed to save user data");
  }

  const dataToSend = {
    _id: finalSavedUser._id,
    username: finalSavedUser.username,
    email: finalSavedUser.email,
    role: finalSavedUser.role,
    isEmailVerified: finalSavedUser.isEmailVerified,
    isProfileComplete: finalSavedUser.isProfileComplete,
    createdAt: finalSavedUser.createdAt,
  };

  return res
    .status(200)
    .cookie("jobify_access_token", requiredTokens.accessToken, accessCookieOptions)
    .cookie("jobify_refresh_token", requiredTokens.refreshToken, refreshCookieOptions)
    .json(new ApiResponse(200, "Login successfully", finalSavedUser));
});

export const logout = asyncHandler(async (req, res) => {
  await UserModel.findByIdAndUpdate(req.id, {
    refreshToken: null,
  });

  return res
    .status(200)
    .clearCookie("jobify_access_token", accessCookieOptions)
    .clearCookie("jobify_refresh_token", refreshCookieOptions)
    .json(new ApiResponse(200, "Logged out successfully", null));
});

export const me = asyncHandler(async (req, res) => {
  const user = await userModel
    .findById(req.id)
    .select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "User data fetched successfully", user));
});

//get all interviewers
export const getAllInterviewers = asyncHandler(async (_, res) => {
  
  const interviewers = await UserModel.aggregate([
    {
      $match: {
        role: { $in: ['recruiter', 'admin'] },
        isProfileComplete: true
      }
    },
    {
      $lookup: {
        from: 'interviewerprofilemodels',
        localField: '_id',
        foreignField: 'user_id',
        as: 'profile'
      }
    },
    {
      $unwind: '$profile'
    },
    {
      $match: {
        'profile.isAvailableForInterview': true
      }
    },
    {
      $project: {
        _id: 1,
        username: 1,
        
    
        fullname: '$profile.fullname',
        designation: '$profile.designation',
        expertiseAreas: '$profile.expertiseAreas',
        totalExperience: '$profile.totalExperience',
        profilePhoto: '$profile.profilePhoto',
        preferredInterviewType: '$profile.preferredInterviewType',
        
      }
    },
    {
      $sort: { 'fullname': 1 }
    }
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, "Interviewers fetched successfully", interviewers));
});
