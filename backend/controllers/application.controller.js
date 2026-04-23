import ApplicationModel from "../models/application.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";



export const submitApplication = asyncHandler(async (req, res) => {
  const { jobId, coverLetter, useExistingResume, resumeUrl } = req.body;
  const userId = req.id;

  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    throw new ApiError(400, "Invalid Job ID");
  }

  if (!coverLetter) {
    throw new ApiError(400, "Cover letter is required");
  }

  
  if (useExistingResume === false && !req.file) {
    throw new ApiError(400, "Resume file is required when uploading new resume");
  }

  if (useExistingResume === true && !resumeUrl) {
    throw new ApiError(400, "Resume URL is required");
  }

  // Check if user has already applied for this job
  const existingApplication = await ApplicationModel.findOne({
    job: jobId,
    candidateApplied: userId,
  });

  if (existingApplication) {
    throw new ApiError(400, "You have already applied for this job");
  }

  let applicationResume;

  // Handle resume based on user choice
  if (useExistingResume === true && resumeUrl) {
    // Use existing resume URL
    applicationResume = resumeUrl;
  } else if (req.file) {
    // Upload new resume file
    let applicationResumePath = req.file.path;
    applicationResume = await uploadOnCloudinary(applicationResumePath , "raw");
  } else {
    throw new ApiError(400, "Resume is required");
  }

  // Create new application
  const newApplication = await ApplicationModel.create({
    job: jobId,
    candidateApplied: userId,
    coverLetter,
    applicationResume,
    status: "applied",
  });

  // Return success response
  return res
    .status(201)
    .json(new ApiResponse(201, newApplication, "Application submitted successfully"));
});