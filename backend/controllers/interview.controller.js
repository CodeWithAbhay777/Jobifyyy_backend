import InterviewModel from "../models/interview.model.js";
import ApplicationModel from "../models/application.model.js";
import JobModel from "../models/jobs.model.js";
import UserModel from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import moment from "moment";
import { sendInterviewInfoToInterviewer } from "../templates/interviewInfoToInterviewer.js";
import { sendInterviewInfoEmailToCandidate } from "../templates/interviewInfoToCandidate.js";
import { sendCandidateShortlistedEmail } from "../templates/candidateShortlisted.js";
import {
  sendInterviewUpdateInfoToCandidate,
  sendInterviewUpdateInfoToInterviewer,
} from "../templates/interviewUpdated.js";
import { emailQueue, emailQueueName } from "../Jobs/sendEmailJob.js";
import FinalReportModel from "../models/finalReport.model.js";
import InterviewerEvaluation from "../models/InterviewerEvaluation.model.js";

export const scheduleInterview = asyncHandler(async (req, res) => {
  const {
    job,
    candidateSelected,
    interviewerAssigned,
    interviewType,
    scheduledAt,
    notes
  } = req.body;

  // Validate required fields
  if (!job || !candidateSelected || !interviewerAssigned || !interviewType || !scheduledAt) {
    throw new ApiError(400, "All required fields must be provided");
  }

  // Check if job exists
  const jobExists = await JobModel.findById(job).select('title department type experienceLevel');
  if (!jobExists) {
    throw new ApiError(404, "Job not found");
  }

  // Check if candidate exists and has applied for this job
  const application = await ApplicationModel.findOne({
    job: job,
    candidateApplied: candidateSelected
  });

  

  if (!application) {
    throw new ApiError(404, "Application not found for this candidate and job");
  }

  const candidateInfo = await UserModel.findById(candidateSelected).select('username email');



  // Check if interviewer exists and is available
  const interviewer = await UserModel.findById(interviewerAssigned);
  if (!interviewer || !['recruiter', 'admin'].includes(interviewer.role)) {
    throw new ApiError(404, "Interviewer not found or not authorized");
  }

  // Validate interview type
  if (!['frontend', 'backend', 'fullstack'].includes(interviewType)) {
    throw new ApiError(400, "Invalid interview type");
  }

  // Validate scheduled time is in the future
  const scheduledTime = new Date(scheduledAt);
  if (scheduledTime <= new Date()) {
    throw new ApiError(400, "Scheduled time must be in the future");
  }

  // Create interview
  const interview = await InterviewModel.create({
    job,
    candidateSelected,
    interviewerAssigned,
    interviewType,
    scheduledAt: scheduledTime,
    notes: notes || ""
  });

  if (!interview) {
    throw new ApiError(500, "Failed to schedule interview");
  }
  

  // Update application status to 'interview-scheduled'
  await ApplicationModel.findByIdAndUpdate(
    application._id,
    { status: 'interview-scheduled' },
    { new: true }
  );

  //send mail to the candidate and interviewer about the scheduled interview
  const getCandidatePayloadForEmail = sendInterviewInfoEmailToCandidate(
    candidateInfo.email,
    candidateInfo.username,
    jobExists.title,
    jobExists.department,
    jobExists.type,
    jobExists.experienceLevel,
    interview.scheduledAt
  );

  const getInterviewerPayloadForEmail = sendInterviewInfoToInterviewer(
    interviewer.email,
    interviewer.username,
    jobExists.title,
    jobExists.department,
    jobExists.type,
    jobExists.experienceLevel,
    interview.scheduledAt
  );

  await emailQueue.add(emailQueueName , getCandidatePayloadForEmail);
  await emailQueue.add(emailQueueName , getInterviewerPayloadForEmail);
  

  return res
    .status(201)
    .json(new ApiResponse(201, "Interview scheduled successfully"));
});


export const getAllInterviews = asyncHandler(async (req, res) => {
  let { page = 1, limit = 20  } = req.query;
  page = parseInt(page) < 1 ? 1 : parseInt(page);
  limit = parseInt(limit) < 1 ? 10 : parseInt(limit);
  const skip = (page - 1) * limit;

  const interviews = await InterviewModel.find()
    .skip(skip)
    .limit(limit)
    .populate("candidateSelected", "username email")
    .populate("interviewerAssigned", "username email")
    .populate("job", "_id title department");

  const totalInterviews = await InterviewModel.countDocuments();
  const totalPages = Math.ceil(totalInterviews / limit);

  return res.status(200).json(new ApiResponse(200, "Interviews fetched successfully", {
    interviews,
    totalInterviews,
    totalPages,
    currentPage: page,
    limit
  }));
});



export const getAllInterviewsOfJob = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, status = "all", interviewType = "all", jobId } = req.query;

  page = parseInt(page) < 1 ? 1 : parseInt(page);
  limit = parseInt(limit) < 1 ? 10 : parseInt(limit);
  
  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    throw new ApiError(400, "Invalid jobId");
  }


  const jobObjectId = new mongoose.Types.ObjectId(jobId);
  const skip = (page - 1) * limit;

 
  const matchCriteria = {};
  if (status && status !== 'all') {
    matchCriteria.status = status;
  }
  if (interviewType && interviewType !== 'all') {
    matchCriteria.interviewType = interviewType;
  }
  matchCriteria.job = jobObjectId;

  

  const interviews = await InterviewModel.aggregate([
    { $match: matchCriteria },
    {
      $lookup: {
        from: UserModel.collection.name,
        localField: 'candidateSelected',
        foreignField: '_id',
        as: 'candidate'
      }
    },
    {
      $lookup: {
        from: UserModel.collection.name,
        localField: 'interviewerAssigned',
        foreignField: '_id',
        as: 'interviewer'
      }
    },
    {
      $lookup: {
        from: JobModel.collection.name,
        localField: 'job',
        foreignField: '_id',
        as: 'jobDetails'
      }
    },
    {
      $lookup: {
        from: FinalReportModel.collection.name,
        localField: '_id',
        foreignField: 'interviewId',
        as: 'finalReport'
      }
    },
    {
      $lookup: {
        from: InterviewerEvaluation.collection.name,
        localField: '_id',
        foreignField: 'interviewId',
        as: 'interviewerEvaluation'
      }
    },
    {
      $lookup: {
        from: 'candidateprofilemodels',
        localField: 'candidateSelected',
        foreignField: 'user_id',
        as: 'candidateProfile'
      }
    },
    {
      $unwind: '$candidate'
    },
    {
      $unwind: '$interviewer'
    },
    {
      $unwind: '$jobDetails'
    },
    {
      $unwind: {
        path: '$candidateProfile',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind: {
        path: '$finalReport',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind: {
        path: '$interviewerEvaluation',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        interviewType: 1,
        scheduledAt: 1,
        status: 1,
        isCandidateSelected: 1,
        currentlyRunning: 1,
        createdAt: 1,
        notes: 1,
        'candidate._id': 1,
        'candidate.username': 1,
        'candidate.email': 1,
        'candidate.profilePhoto': '$candidateProfile.profilePhoto',
        'candidate.phone': '$candidateProfile.phone',
        'interviewer._id': 1,
        'interviewer.username': 1,
        'interviewer.email': 1,
        'interviewer.role': 1,
        'interviewer.profilePhoto': 1,
        'jobDetails.title': 1,
        'jobDetails.department': 1,
        finalReport: {
          _id: '$finalReport._id',
          aiScorePercentage: '$finalReport.aiScorePercentage',
          interviewerScorePercentage: '$finalReport.interviewerScorePercentage',
          finalScore: '$finalReport.finalScore',
          createdAt: '$finalReport.createdAt'
        },
        interviewerEvaluation: {
          _id: '$interviewerEvaluation._id',
          totalScore: '$interviewerEvaluation.totalScore',
          percentage: '$interviewerEvaluation.percentage',
          recommendationNote: '$interviewerEvaluation.recommendationNote'
        },
        result: {
          finalResult: '$finalReport.finalScore'
        }
      }
    },
    { $sort: { scheduledAt: -1 } },
    { $skip: skip },
    { $limit: parseInt(limit) }
  ]);

  const totalInterviews = await InterviewModel.countDocuments(matchCriteria);
  const totalPages = Math.ceil(totalInterviews / parseInt(limit));

  return res
    .status(200)
    .json(new ApiResponse(200, "Interviews fetched successfully", {
      interviews,
      totalInterviews,
      totalPages,
      currentPage: parseInt(page),
      limit: parseInt(limit)
    }));
});

export const updateInterviewStatus = asyncHandler(async (req, res) => {
  
  const { id } = req.params;
  const { status, currentlyRunning } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid Interview ID");
  }

  if (status && !['scheduled', 'completed', 'cancelled'].includes(status)) {
    throw new ApiError(400, "Invalid status value");
  }

  const interview = await InterviewModel.findById(id);
  if (!interview) {
    throw new ApiError(404, "Interview not found");
  }

  const updateData = {};
  if (status) updateData.status = status;
  if (typeof currentlyRunning === 'boolean') updateData.currentlyRunning = currentlyRunning;

  const updatedInterview = await InterviewModel.findByIdAndUpdate(
    id,
    updateData,
    { new: true }
  ).populate('candidateSelected', 'username email')
   .populate('interviewerAssigned', 'username email')
   .populate('job', 'title department');

  // If interview is completed, update application status
  if (status === 'completed') {
    await ApplicationModel.findOneAndUpdate(
      { 
        job: interview.job,
        candidateApplied: interview.candidateSelected
      },
      { status: 'interview-completed' }
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Interview updated successfully", updatedInterview));
});

export const getInterviewById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid Interview ID");
  }

  const interview = await InterviewModel.findById(id)
    .populate('candidateSelected', 'username email')
    .populate('interviewerAssigned', 'username email')
    .populate('job', 'title department description skillsRequired');

  if (!interview) {
    throw new ApiError(404, "Interview not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Interview fetched successfully", interview));
});



// Get all interviews for a specific candidate
export const getAllCandidateInterviews = asyncHandler(async (req, res) => {
  const candidateId = req.id; // Get candidate ID from authenticated user
  const {status = "all"} = req.query;
  
  console.log("Candidate ID:", candidateId, "Status:", status);

  if (!candidateId) {
    throw new ApiError(400, "Candidate ID is required");
  }

  // Build match criteria
  let matchCriteria = { candidateSelected: candidateId };
  if(status !== "all" && ['scheduled', 'completed', 'cancelled'].includes(status)){
    matchCriteria.status = status;
  }

  const interviews = await InterviewModel.find(matchCriteria)
    .populate('job', 'title department')
    .sort({ scheduledAt: -1 });
    
  
  const formattedInterviews = interviews.map(interview => {
    const interviewObj = interview.toObject();
    interviewObj.scheduledAt = moment
      .utc(interview.scheduledAt)
      .local()
      .format("YYYY-MM-DD HH:mm");
    return interviewObj;
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Interviews fetched successfully", formattedInterviews));
});


export const getAllRecruiterInterviews = asyncHandler(async (req, res) => {
  const recruiterId = req.id; // Get recruiter ID from authenticated user
  const {status = "all"} = req.query;
  if (!recruiterId) {
    throw new ApiError(400, "Recruiter ID is required");
  }

  // Build match criteria
  let matchCriteria = { interviewerAssigned: recruiterId };
  if(status !== "all" && ['scheduled', 'completed', 'cancelled'].includes(status)){
    matchCriteria.status = status;
  }

  const interviews = await InterviewModel.find(matchCriteria)
    .populate('job', 'title department')
    .populate('candidateSelected', 'username email')
    .sort({ scheduledAt: -1 });

  res.status(200).json(new ApiResponse(200, "Interviews fetched successfully", interviews));


});

//Shortlist Candidates for interview
export const shortlistCandidateForInterview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isCandidateSelected } = req.body;


  if (typeof isCandidateSelected !== 'string' || !['selected', 'pending'].includes(isCandidateSelected)) {
    throw new ApiError(400, "isCandidateSelected must be a string with value 'selected' or 'pending'");
  }

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid Interview ID");
  }

  const interview = await InterviewModel.findById(id);
  
  if (!interview) {
    throw new ApiError(404, "Interview not found");
  }

  if (!interview.isScoreGiven){
    throw new ApiError(400, "Cannot shortlist candidate before giving score");
  } 

  if (interview.status !== 'completed') {
    throw new ApiError(400, "Cannot shortlist candidate before interview is completed");
  }

  interview.isCandidateSelected = isCandidateSelected;
  await interview.save();

  if (isCandidateSelected === "selected") {
    console.log('IMMMMM INSIDEEE MAILLLLL')
    const [candidateInfo, jobInfo] = await Promise.all([
      UserModel.findById(interview.candidateSelected).select("username email"),
      JobModel.findById(interview.job).select("title department")
    ]);

    if (candidateInfo?.email && jobInfo) {
      const shortlistedEmailPayload = sendCandidateShortlistedEmail(
        candidateInfo.email,
        candidateInfo.username,
        jobInfo.title,
        jobInfo.department
      );

      await emailQueue.add(emailQueueName, shortlistedEmailPayload);
    }
  }

  return res.status(200).json(new ApiResponse(200, "Candidate shortlisted successfully"));
});

//edit interview details
export const updateInterviewDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid Interview ID");
  }

  const interview = await InterviewModel.findById(id);
  if (!interview) {
    throw new ApiError(404, "Interview not found");
  }

  if (interview.status === 'completed' || interview.currentlyRunning || interview.isInterviewerJoined) {
    throw new ApiError(400, "Cannot edit interview details after it has started or completed");
  }

  if (interview.scheduledAt.getTime() <= Date.now()) {
      throw new ApiError(400, "Cannot reschedule interview that has already started");
  }

  const dataToUpdate = {};
  let isInterviewerChanged = false;
  let isRescheduled = false;
  let isInterviewTypeChanged = false;
  let isNotesChanged = false;

  if (req.body.interviewerAssigned){
    const interviewer = await UserModel.findById(req.body.interviewerAssigned);
    if (!interviewer || !['recruiter', 'admin'].includes(interviewer.role)) {
      throw new ApiError(404, "Interviewer not found or not authorized");
    }
    if (interview.interviewerAssigned.toString() !== req.body.interviewerAssigned) {
      isInterviewerChanged = true;
    }
    dataToUpdate.interviewerAssigned = req.body.interviewerAssigned;

  }
 
  if (req.body.scheduledAt){
    const scheduledTime = new Date(req.body.scheduledAt);
    if (scheduledTime <= new Date()) {
      throw new ApiError(400, "Scheduled time must be in the future");
    }
    if (interview.scheduledAt.getTime() !== scheduledTime.getTime()) {
      isRescheduled = true;
    }

    dataToUpdate.scheduledAt = scheduledTime;
  }

  if (req.body.interviewType) {
    if (!["frontend", "backend", "fullstack"].includes(req.body.interviewType)) {
      throw new ApiError(400, "Invalid interview type");
    }
    if (interview.interviewType !== req.body.interviewType) {
      isInterviewTypeChanged = true;
    }
    dataToUpdate.interviewType = req.body.interviewType;
  }

  
  if (req.body.notes !== undefined && typeof req.body.notes === "string") {
    if ((interview.notes || "") !== req.body.notes) {
      isNotesChanged = true;
    }
    dataToUpdate.notes = req.body.notes;
  }

  if (Object.keys(dataToUpdate).length === 0) {
    throw new ApiError(400, "No interview details provided to update");
  }

  const updatedInterview = await InterviewModel.findByIdAndUpdate(id, dataToUpdate, {
    new: true,
  });

  const [candidateInfo, interviewerInfo, jobInfo] = await Promise.all([
    UserModel.findById(interview.candidateSelected).select("username email"),
    UserModel.findById(updatedInterview.interviewerAssigned).select("username email"),
    JobModel.findById(interview.job).select("title department type experienceLevel"),
  ]);

  if (!jobInfo) {
    throw new ApiError(404, "Job not found");
  }

  if (isInterviewerChanged && interviewerInfo?.email) {
    const assignedInterviewerPayload = sendInterviewInfoToInterviewer(
      interviewerInfo.email,
      interviewerInfo.username,
      jobInfo.title,
      jobInfo.department,
      jobInfo.type,
      jobInfo.experienceLevel,
      updatedInterview.scheduledAt
    );

    await emailQueue.add(emailQueueName, assignedInterviewerPayload);
  }

  const isInterviewUpdated = isRescheduled || isInterviewTypeChanged || isNotesChanged;

  if (isInterviewUpdated) {
    if (candidateInfo?.email) {
      const candidateUpdatePayload = sendInterviewUpdateInfoToCandidate(
        candidateInfo.email,
        candidateInfo.username,
        jobInfo.title,
        jobInfo.department,
        jobInfo.type,
        jobInfo.experienceLevel,
        updatedInterview.scheduledAt
      );
      await emailQueue.add(emailQueueName, candidateUpdatePayload);
    }

    if (interviewerInfo?.email) {
      const interviewerUpdatePayload = sendInterviewUpdateInfoToInterviewer(
        interviewerInfo.email,
        interviewerInfo.username,
        jobInfo.title,
        jobInfo.department,
        jobInfo.type,
        jobInfo.experienceLevel,
        updatedInterview.scheduledAt
      );
      await emailQueue.add(emailQueueName, interviewerUpdatePayload);
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Interview details updated successfully"));

  
});