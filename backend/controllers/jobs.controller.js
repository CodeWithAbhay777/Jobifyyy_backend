import moment from "moment";
import JobModel from "../models/jobs.model.js";
import ApplicationModel from "../models/application.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

export const createJob = asyncHandler(async (req, res) => {
  const postJob = await JobModel.create(req.body);
  if (!postJob) throw new ApiError(500, "Posting job : Something went wrong!");
  res.status(201).
    json(new ApiResponse(201, "Job posted successfully!"));
});

export const getAllJobsByAdmin = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;


  const { search = "", department, state, status = "all" } = req.query;


  const matchStage = {};
  if (department) matchStage.department = department;
  if (state !== "all" && state !== undefined && state === "open") matchStage.isOpen = true;
  if (state !== "all" && state !== undefined && state === "closed") matchStage.isOpen = false;


  if (search) matchStage.title = { $regex: search, $options: "i" };

  const jobs = await JobModel.aggregate([
    { $match: matchStage },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },


    {
      $lookup: {
        from: "applicationmodels",
        let: { jobId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$job", "$$jobId"] } } },

          ...(status !== "all" ? [{ $match: { status } }] : [])
        ],
        as: "applications",
      },
    },


    {
      $addFields: {
        applicantsCount: { $size: "$applications" },
      },
    },


    {
      $project: {
        title: 1,
        type: 1,
        department: 1,
        experienceLevel: 1,
        salaryOffered: 1,
        isOpen: 1,
        salaryCurrency: 1,
        applicantsCount: 1,
      },
    },
  ]);

  if (!jobs?.length) {
    throw new ApiError(404, "No jobs found");
  }

  const totalJobs = await JobModel.countDocuments(matchStage);


  res.status(200).
    json(new ApiResponse(200, "Jobs fetched successfully!", { jobs, page, limit, totalJobs, totalPages: Math.ceil(totalJobs / limit) }));

});


export const getIndividualJobForAdmin = asyncHandler(async (req, res) => {
  const jobId = req.params?.id;

  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    throw new ApiError(400, "Invalid Job ID");
  }

  const job = await JobModel.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(jobId) } },
    {
      $lookup: {
        from: 'applicationmodels',
        localField: '_id',
        foreignField: 'job',
        as: 'applications'
      }

    },
    {
      $addFields: {
        applicantsCount: { $size: '$applications' }
      }
    },
    {
      $project: {
        applications: 0
      }
    }
  ]);

  if (!job?.length) {
    throw new ApiError(404, "Job not found");
  }

  job[0].applicationDeadline = moment(job[0].applicationDeadline).format("D MMM YYYY");
  job[0].createdAt = moment(job[0].createdAt).format("D MMM YYYY");
  job[0].updatedAt = moment(job[0].updatedAt).format("D MMM YYYY");

  res.status(200).json(new ApiResponse(200, "Job fetched successfully!", job[0]));
});


export const getJobInfoByAdmin = asyncHandler(async (req, res) => {
  const jobId = req.params?.id;
  let { page = 1, limit = 20, status = "all" } = req.query;
  limit = parseInt(limit);
  page = parseInt(page);
  const skip = (page - 1) * limit;

  

  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    throw new ApiError(400, "Invalid Job ID");
  }

  if (status !== "all" && !['applied', 'interview-scheduled', 'rejected', 'interview-completed'].includes(status)) {
    throw new ApiError(400, "Invalid status value");
  }

  const matchStage = { job: new mongoose.Types.ObjectId(jobId) };
  if (status !== "all") {
    matchStage.status = status;
  }

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "usermodels",
        localField: "candidateApplied",
        foreignField: "_id",
        as: "candidateApplied"
      }
    },
    {
      $unwind: "$candidateApplied"
    },
    {
      $lookup: {
        from: "candidateprofilemodels",
        localField: "candidateApplied._id",
        foreignField: "user_id",
        as: "candidateProfile"
      }
    },
    {
      $addFields: {
        "candidateApplied.fullname": { 
          $ifNull: [{ $arrayElemAt: ["$candidateProfile.fullname", 0] }, null] 
        },
        "candidateApplied.phone": { 
          $ifNull: [{ $arrayElemAt: ["$candidateProfile.phone", 0] }, null] 
        },
        "candidateApplied.address": { 
          $ifNull: [{ $arrayElemAt: ["$candidateProfile.address", 0] }, null] 
        },
        "candidateApplied.college": { 
          $ifNull: [{ $arrayElemAt: ["$candidateProfile.college", 0] }, null] 
        },
        "candidateApplied.skills": { 
          $ifNull: [{ $arrayElemAt: ["$candidateProfile.skills", 0] }, []] 
        },
        "candidateApplied.experience": { 
          $ifNull: [{ $arrayElemAt: ["$candidateProfile.experience", 0] }, 0] 
        },
        "candidateApplied.resume": { 
          $ifNull: [{ $arrayElemAt: ["$candidateProfile.resume", 0] }, null] 
        },
        "candidateApplied.bio": { 
          $ifNull: [{ $arrayElemAt: ["$candidateProfile.bio", 0] }, null] 
        },
        "candidateApplied.profilePhoto": { 
          $ifNull: [{ $arrayElemAt: ["$candidateProfile.profilePhoto", 0] }, null] 
        },
        "candidateApplied.linkedInProfile": { 
          $ifNull: [{ $arrayElemAt: ["$candidateProfile.linkedInProfile", 0] }, null] 
        },
        "candidateApplied.githubProfile": { 
          $ifNull: [{ $arrayElemAt: ["$candidateProfile.githubProfile", 0] }, null] 
        }
      }
    },
    // 4) project only the fields we want (remove sensitive fields)
    {
      $project: {
        
        _id: 1,
        status: 1,
        coverLetter: 1,
        applicationResume: 1,
        createdAt: 1,
        "candidateApplied._id": 1,
        "candidateApplied.username": 1,
        "candidateApplied.email": 1,
        "candidateApplied.fullname": 1,
        "candidateApplied.phone": 1,
        "candidateApplied.address": 1,
        "candidateApplied.college": 1,
        "candidateApplied.skills": 1,
        "candidateApplied.experience": 1,
        "candidateApplied.resume": 1,
        "candidateApplied.bio": 1,
        "candidateApplied.profilePhoto": 1,
        "candidateApplied.linkedInProfile": 1,
        "candidateApplied.githubProfile": 1
      }
    },
    // 5) Use $facet to get paginated data AND total count in one query
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
        ],
        totalCount: [
          { $count: "count" }
        ]
      }
    }

    
  ]



  const result = await ApplicationModel.aggregate(pipeline);

  if (!result?.length) {
    throw new ApiError(404, "Job not found");
  }

  const facet = result[0] || { data: [], totalCount: [] };
  const applications = facet.data || [];
  const totalApplications = (facet.totalCount[0] && facet.totalCount[0].count) ? facet.totalCount[0].count : 0;
  const totalPages = Math.ceil(totalApplications / limit) || 0;

  res.status(200).json(new ApiResponse(200, "Job applications fetched successfully", {
    
    applications,
    page,
    limit,
    totalApplications,
    totalPages
  }));


});

//FOR ALL CANDIDATES

export const getJobsForCandidates = asyncHandler(async (req, res) => {



  const limit = parseInt(req.query.limit) || 20;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const { search = "", department, state, jobType, experienceLevel, candidateId, appliedJobs = "false" } = req.query;


  // ---------- Base filters ----------
  const matchStage = {};
  if (department) matchStage.department = department;
  if (state !== "all" && state !== undefined && state === "open") matchStage.isOpen = true;
  if (state !== "all" && state !== undefined && state === "closed") matchStage.isOpen = false;
  if (jobType && jobType !== "none") matchStage.type = jobType;
  if (experienceLevel && experienceLevel !== "none") matchStage.experienceLevel = experienceLevel;
  if (search) matchStage.title = { $regex: search, $options: "i" };

  // ---------- Aggregate pipeline ----------
  const pipeline = [
    { $match: matchStage },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },

    // Lookup all applications for counting
    {
      $lookup: {
        from: "applicationmodels",
        localField: "_id",
        foreignField: "job",
        as: "allApplications",
      },
    },

    // Add applicants count
    {
      $addFields: {
        applicantsCount: { $size: "$allApplications" },
      },
    },

    // Project only required fields (we'll add hasApplied later)
    {
      $project: {
        title: 1,
        type: 1,
        department: 1,
        experienceLevel: 1,
        salaryOffered: 1,
        salaryCurrency: 1,
        salaryPeriod: 1,
        isOpen: 1,
        applicantsCount: 1,
        createdAt: 1,
      },
    },
  ];

  const jobsResult = await JobModel.aggregate(pipeline);

  // Get user's applications to determine hasApplied status
  const userApplications = await ApplicationModel.find({
    candidateApplied: candidateId
  }).select('job');



  const appliedJobIds = new Set(userApplications.map(app => app.job.toString()));



  // Add hasApplied field to each job
  const jobsWithAppliedStatus = jobsResult.map(job => ({
    ...job,
    hasApplied: appliedJobIds.has(job._id.toString())
  }));

  // Filter based on appliedJobs parameter
  let filteredJobs = jobsWithAppliedStatus;


  if (appliedJobs === "true") {
    filteredJobs = jobsWithAppliedStatus.filter(job => job.hasApplied === true);

  } else if (appliedJobs === "false") {
    filteredJobs = jobsWithAppliedStatus.filter(job => job.hasApplied === false);

  }

  // Format dates for the final result
  const formattedJobs = filteredJobs.map((job) => ({
    ...job,
    createdAtRelative: moment(job.createdAt).fromNow(),
    createdAtFormatted: moment(job.createdAt).format("D MMM YYYY"),
  }));

  // For pagination (note: this count might not be exact after filtering, but it's close enough)
  const totalJobs = await JobModel.countDocuments(matchStage);

  res.status(200).json(
    new ApiResponse(200, "Jobs fetched successfully!", {
      jobs: formattedJobs,
      page,
      limit,
      totalJobs,
      totalPages: Math.ceil(totalJobs / limit),
    })
  );
});


export const getIndividualJob = asyncHandler(async (req, res) => {
  const jobId = req.params?.id;
  const userID = req.id;

  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    throw new ApiError(400, "Invalid Job ID");
  }
  if (!userID || !mongoose.Types.ObjectId.isValid(userID)) {
    throw new ApiError(400, "Invalid User ID");
  }


  let isAlreadyApplied = false;

  const isApplicationPresent = await ApplicationModel.findOne({ job: jobId, candidateApplied: userID });

  if (isApplicationPresent) isAlreadyApplied = true;

  const job = await JobModel.findById(jobId);

  if (!job) throw new ApiError(404, "Job not found!");

  res.status(200).json(new ApiResponse(200, "Job fetched successfully!", { job, isAlreadyApplied }));

});


//admin edit job
export const editJob = asyncHandler(async (req,res) => {
  const jobId = req.params?.id;

  if(!jobId || !mongoose.Types.ObjectId.isValid(jobId)) throw new ApiError(400, "Invalid Job ID");

  const editableObject = {};

  if (req.body.title) editableObject.title = req.body.title;
  if (req.body.type) editableObject.type = req.body.type;
  if (req.body.department) editableObject.department = req.body.department;
  if (req.body.experienceLevel) editableObject.experienceLevel = req.body.experienceLevel;
  if (req.body.salaryOffered) editableObject.salaryOffered = req.body.salaryOffered;
  if (req.body.salaryCurrency) editableObject.salaryCurrency = req.body.salaryCurrency;
  if (req.body.salaryPeriod) editableObject.salaryPeriod = req.body.salaryPeriod;
  if (req.body.isOpen !== undefined) editableObject.isOpen = req.body.isOpen;
  if (req.body.applicationDeadline) editableObject.applicationDeadline = req.body.applicationDeadline;

  if (Object.keys(editableObject).length === 0) {
    throw new ApiError(400, "At least one field is required to update");
  }
  await JobModel.findByIdAndUpdate(jobId, editableObject);

  res.status(200).json(new ApiResponse(200, "Job edited successfully!"));

});


//admin delete job
export const deleteJob = asyncHandler(async (req,res) => {
    const jobId = req.params?.id;

    if(!jobId || !mongoose.Types.ObjectId.isValid(jobId)) throw new ApiError(400, "Invalid Job ID");

  const deletedJob = await JobModel.findByIdAndDelete(jobId);

  if (!deletedJob) throw new ApiError(404, "Job not found");

  res.status(200).json(new ApiResponse(200, "Job deleted successfully"));



    
});

