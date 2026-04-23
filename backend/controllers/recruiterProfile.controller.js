import InterviewerProfileModel from "../models/interviewerProfile.model.js";
import UserModel from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

export const submitRecruiterProfile = asyncHandler(async (req, res) => {
  const {
    user_id,
    fullname,
    phone,
    address,
    designation,
    linkedInProfile,
    expertiseAreas,
    totalExperience,
    bio,
    preferredInterviewType,
  } = req.body;

  if (
    !user_id ||
    !fullname ||
    !phone ||
    !address ||
    !designation ||
    !expertiseAreas
  ) {
    throw new ApiError(400, "Required fields are missing");
  }

  let profilePhotoLocalPath = "";

  if (
    req.files &&
    Array.isArray(req.files.profilePhoto) &&
    req.files.profilePhoto.length > 0
  ) {
    profilePhotoLocalPath = req.files.profilePhoto[0].path;
  }

  let urlProfilePhoto;

  if (profilePhotoLocalPath) {
    urlProfilePhoto = await uploadOnCloudinary(profilePhotoLocalPath);
  }

  const createdProfile = await InterviewerProfileModel.create({
    user_id,
    fullname,
    phone,
    address,
    designation,
    expertiseAreas: expertiseAreas || [],
    totalExperience: totalExperience ? Number(totalExperience) : 0,
    linkedInProfile: linkedInProfile || "",
    bio: bio || "",
    profilePhoto: urlProfilePhoto || "",
    preferredInterviewType: preferredInterviewType || "fullstack",
  });

  if (!createdProfile) {
    throw new ApiError(500, "Failed to create recruiter profile");
  }

  const newUpdatedUser = await UserModel.findByIdAndUpdate(
    user_id,
    {
      isProfileComplete: true,
    },
    { new: true }
  ).select("-password -refreshToken");

  if (!newUpdatedUser) {
    throw new ApiError(500, "Failed to update user profile completion status");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, "Recruiter profile created successfully", {
        createdProfile,
        newUpdatedUser,
      })
    );
});


export const getRecruiterOrAdminProfile = asyncHandler(async (req,res) => {

    const {userId , role} = req.query;

    if (!userId || !role) throw new ApiError(400 , "userId or role is required to fetch profile");

    if (!(role === 'recruiter' || role === 'admin')) throw new ApiError(400 , "Invalid role");

    const userProfile = await InterviewerProfileModel.findOne({user_id : userId});

    if (!userProfile) throw new ApiError(404 , "Profile not found!");

    return res.status(200).json(new ApiResponse(200 , "Profile get successfully" , userProfile));

})
