import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import evaluateAnswersByAI from "../utils/AI_Evaluation.js";
import AIEvaluation from "../models/AIEvaluation.model.js";
import InterviewerEvaluation from "../models/InterviewerEvaluation.model.js";
import FinalReportModel from "../models/finalReport.model.js";
import InterviewModel from "../models/interview.model.js";
import JobModel from "../models/jobs.model.js";
import UserModel from "../models/user.model.js";
import {finalScoringQueue , finalScoringQueueName} from "../Jobs/createReportJob.js";

export const evaluateCandidateAnswer = asyncHandler(async (req, res) => {
    const { question, candidateAnswer, difficulty, interviewId } = req.body;

    if (!question || !candidateAnswer || !difficulty) {
        throw new ApiError(400, "Question, candidate answer, and difficulty are required");
    }

    if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
        throw new ApiError(400, "Invalid Interview ID");
    }

    const ai_res = await evaluateAnswersByAI({ question, candidateAnswer, difficulty });

    if (!ai_res.success) {
        throw new ApiError(500, ai_res.error || "Failed to evaluate the candidate's answer");
    }

    const aiEvaluationData = {
        interview_Id: interviewId,
        question,
        candidateAnswer,
        difficulty,
        accuracy: parseInt(ai_res.response.accuracy),
        depth: parseInt(ai_res.response.depth),
        clarity: parseInt(ai_res.response.clarity),
        confidence: parseInt(ai_res.response.confidence),
        totalScore: parseInt(ai_res.response.totalScore),
        improvements: ai_res.response.improvements
    };

    const aiEvaluation = new AIEvaluation(aiEvaluationData);
    await aiEvaluation.save();
    res.status(200).json(new ApiResponse(200, "Candidate answer evaluated successfully"));


});

export const evaluateInterviewerEvaluation = asyncHandler(async (req, res) => {
    const { scores, recommendation, totalScore, percentage, interviewId } = req.body;

    if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
        throw new ApiError(400, "Invalid Interview ID");
    }

    const interviewerEvaluationData = {
        interviewId,
        problemSolving : parseInt(scores.problemSolving),
        communication : parseInt(scores.communication),
        technicalKnowledge : parseInt(scores.technicalKnowledge),
        confidence : parseInt(scores.confidence),
        overallImpression : scores.overallImpression,
        recommendationNote: recommendation,
        totalScore : parseInt(totalScore),
        percentage : parseFloat(percentage)
    };
    const interviewerEvaluation = new InterviewerEvaluation(interviewerEvaluationData);
    await interviewerEvaluation.save();

    await finalScoringQueue.add(finalScoringQueueName, {
        percentage : parseFloat(percentage),
        interviewId
    });

    //update interview model by isScoreGiven true
    await InterviewModel.findByIdAndUpdate(interviewId, { isScoreGiven: true });

    res.status(201).json(new ApiResponse(201, "Interviewer evaluation saved successfully"));
});

//get routes for candidates and recruiters
export const getCandidateReports = asyncHandler(async (req, res) => {
    const candidateId = req.id;

    if (!candidateId || !mongoose.Types.ObjectId.isValid(candidateId)) {
        throw new ApiError(401, "Unauthorized request");
    }

    const candidateObjectId = new mongoose.Types.ObjectId(candidateId);

    const reports = await FinalReportModel.aggregate([
        // Join the report with its interview so we can filter by candidateSelected.
        {
            $lookup: {
                from: InterviewModel.collection.name,
                localField: "interviewId",
                foreignField: "_id",
                as: "interview",
            },
        },
        // Each report should have exactly one interview, so flatten the array.
        {
            $unwind: "$interview",
        },
        // Keep only the reports that belong to the authenticated candidate.
        {
            $match: {
                "interview.candidateSelected": candidateObjectId,
            },
        },
        // Hydrate only the job summary needed for the report card.
        {
            $lookup: {
                from: JobModel.collection.name,
                localField: "interview.job",
                foreignField: "_id",
                as: "job",
            },
        },
        // Convert the lookup array back into a plain object.
        {
            $set: {
                job: { $arrayElemAt: ["$job", 0] },
            },
        },
        // Return only the fields the frontend needs for the compact report box.
        {
            $project: {
                interviewId: 1,
                aiScorePercentage: 1,
                interviewerScorePercentage: 1,
                finalScore: 1,
                createdAt: 1,
                updatedAt: 1,
                job: {
                    _id: "$job._id",
                    title: "$job.title",
                    department: "$job.department",
                    type: "$job.type",
                    salaryOffered: "$job.salaryOffered",
                    salaryPeriod: "$job.salaryPeriod",
                    salaryCurrency: "$job.salaryCurrency",
                },
            },
        },
        // Show latest reports first.
        {
            $sort: { createdAt: -1 },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, "Candidate reports fetched successfully", reports));
});


//get detailed report
export const getCandidateReportDetail = asyncHandler(async (req, res) => {
    const candidateId = req.id;
    const { reportId } = req.params;

    if (!candidateId || !mongoose.Types.ObjectId.isValid(candidateId)) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
        throw new ApiError(400, "Invalid report id");
    }

    const candidateObjectId = new mongoose.Types.ObjectId(candidateId);
    const reportObjectId = new mongoose.Types.ObjectId(reportId);

    const detailedReport = await FinalReportModel.aggregate([
        // Start from the requested report document.
        {
            $match: {
                _id: reportObjectId,
            },
        },
        // Join interview to enforce ownership and provide interview context.
        {
            $lookup: {
                from: InterviewModel.collection.name,
                localField: "interviewId",
                foreignField: "_id",
                as: "interview",
            },
        },
        // Final report always maps to one interview.
        {
            $unwind: "$interview",
        },
        // Security filter: only the owner candidate can fetch this detailed report.
        {
            $match: {
                "interview.candidateSelected": candidateObjectId,
            },
        },
        // Join job details used in detailed report page.
        {
            $lookup: {
                from: JobModel.collection.name,
                localField: "interview.job",
                foreignField: "_id",
                as: "job",
            },
        },
        // Join candidate and interviewer user profiles for name/email display.
        {
            $lookup: {
                from: UserModel.collection.name,
                localField: "interview.candidateSelected",
                foreignField: "_id",
                as: "candidate",
            },
        },
        {
            $lookup: {
                from: UserModel.collection.name,
                localField: "interview.interviewerAssigned",
                foreignField: "_id",
                as: "interviewer",
            },
        },
        // Join all per-question AI evaluations (Q/A, scores, improvements) for this interview.
        {
            $lookup: {
                from: AIEvaluation.collection.name,
                let: { interviewDocId: "$interview._id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$interview_Id", "$$interviewDocId"] },
                        },
                    },
                    {
                        $sort: { createdAt: 1 },
                    },
                ],
                as: "aiEvaluations",
            },
        },
        // Join interviewer evaluation (single summary entry).
        {
            $lookup: {
                from: InterviewerEvaluation.collection.name,
                localField: "interview._id",
                foreignField: "interviewId",
                as: "interviewerEvaluation",
            },
        },
        // Normalize one-to-one lookups from arrays into objects.
        {
            $set: {
                job: { $arrayElemAt: ["$job", 0] },
                candidate: { $arrayElemAt: ["$candidate", 0] },
                interviewer: { $arrayElemAt: ["$interviewer", 0] },
                interviewerEvaluation: { $arrayElemAt: ["$interviewerEvaluation", 0] },
            },
        },
        // Return a detailed but frontend-safe payload.
        {
            $project: {
                _id: 1,
                interviewId: 1,
                aiScorePercentage: 1,
                interviewerScorePercentage: 1,
                finalScore: 1,
                createdAt: 1,
                updatedAt: 1,
                interview: {
                    _id: "$interview._id",
                    interviewType: "$interview.interviewType",
                    scheduledAt: "$interview.scheduledAt",
                    notes: "$interview.notes",
                    status: "$interview.status",
                    isScoreGiven: "$interview.isScoreGiven",
                    currentlyRunning: "$interview.currentlyRunning",
                    isInterviewerJoined: "$interview.isInterviewerJoined",
                    roomId: "$interview.roomId",
                },
                job: {
                    _id: "$job._id",
                    title: "$job.title",
                    department: "$job.department",
                    type: "$job.type",
                    description: "$job.description",
                    experienceLevel: "$job.experienceLevel",
                    skillsRequired: "$job.skillsRequired",
                    salaryOffered: "$job.salaryOffered",
                    salaryPeriod: "$job.salaryPeriod",
                    salaryCurrency: "$job.salaryCurrency",
                },
                candidate: {
                    _id: "$candidate._id",
                    username: "$candidate.username",
                    email: "$candidate.email",
                },
                interviewer: {
                    _id: "$interviewer._id",
                    username: "$interviewer.username",
                    email: "$interviewer.email",
                },
                interviewerEvaluation: {
                    _id: "$interviewerEvaluation._id",
                    problemSolving: "$interviewerEvaluation.problemSolving",
                    communication: "$interviewerEvaluation.communication",
                    technicalKnowledge: "$interviewerEvaluation.technicalKnowledge",
                    confidence: "$interviewerEvaluation.confidence",
                    overallImpression: "$interviewerEvaluation.overallImpression",
                    totalScore: "$interviewerEvaluation.totalScore",
                    percentage: "$interviewerEvaluation.percentage",
                    recommendationNote: "$interviewerEvaluation.recommendationNote",
                    createdAt: "$interviewerEvaluation.createdAt",
                },
                aiEvaluations: {
                    $map: {
                        input: "$aiEvaluations",
                        as: "ai",
                        in: {
                            _id: "$$ai._id",
                            question: "$$ai.question",
                            candidateAnswer: "$$ai.candidateAnswer",
                            difficulty: "$$ai.difficulty",
                            accuracy: "$$ai.accuracy",
                            depth: "$$ai.depth",
                            clarity: "$$ai.clarity",
                            confidence: "$$ai.confidence",
                            totalScore: "$$ai.totalScore",
                            improvements: "$$ai.improvements",
                            createdAt: "$$ai.createdAt",
                        },
                    },
                },
            },
        },
    ]);

    if (!detailedReport.length) {
        throw new ApiError(404, "Detailed report not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Candidate detailed report fetched successfully", detailedReport[0]));

});


//get detailed report for admin
export const getCandidateReportDetailForAdmin = asyncHandler(async (req, res) => {
    const { interviewId } = req.params;

    if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
        throw new ApiError(400, "Invalid interview id");
    }

    const interviewObjectId = new mongoose.Types.ObjectId(interviewId);

    const detailedReport = await FinalReportModel.aggregate([
        {
            $match: {
                interviewId: interviewObjectId,
            },
        },
        {
            $lookup: {
                from: InterviewModel.collection.name,
                localField: "interviewId",
                foreignField: "_id",
                as: "interview",
            },
        },
        {
            $unwind: "$interview",
        },
        {
            $lookup: {
                from: JobModel.collection.name,
                localField: "interview.job",
                foreignField: "_id",
                as: "job",
            },
        },
        {
            $lookup: {
                from: UserModel.collection.name,
                localField: "interview.candidateSelected",
                foreignField: "_id",
                as: "candidateSelected",
            },
        },
        {
            $lookup: {
                from: UserModel.collection.name,
                localField: "interview.interviewerAssigned",
                foreignField: "_id",
                as: "interviewer",
            },
        },
        {
            $lookup: {
                from: AIEvaluation.collection.name,
                let: { interviewDocId: "$interview._id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$interview_Id", "$$interviewDocId"] },
                        },
                    },
                    {
                        $sort: { createdAt: 1 },
                    },
                ],
                as: "aiEvaluations",
            },
        },
        {
            $lookup: {
                from: InterviewerEvaluation.collection.name,
                localField: "interview._id",
                foreignField: "interviewId",
                as: "interviewerEvaluation",
            },
        },
        {
            $set: {
                job: { $arrayElemAt: ["$job", 0] },
                candidateSelected: { $arrayElemAt: ["$candidateSelected", 0] },
                interviewer: { $arrayElemAt: ["$interviewer", 0] },
                interviewerEvaluation: { $arrayElemAt: ["$interviewerEvaluation", 0] },
            },
        },
        {
            $project: {
                _id: 1,
                interviewId: 1,
                aiScorePercentage: 1,
                interviewerScorePercentage: 1,
                finalScore: 1,
                createdAt: 1,
                updatedAt: 1,
                interview: {
                    _id: "$interview._id",
                    interviewType: "$interview.interviewType",
                    scheduledAt: "$interview.scheduledAt",
                    notes: "$interview.notes",
                    status: "$interview.status",
                    isScoreGiven: "$interview.isScoreGiven",
                    currentlyRunning: "$interview.currentlyRunning",
                    isInterviewerJoined: "$interview.isInterviewerJoined",
                    roomId: "$interview.roomId",
                },
                job: {
                    _id: "$job._id",
                    title: "$job.title",
                    department: "$job.department",
                    type: "$job.type",
                    description: "$job.description",
                    experienceLevel: "$job.experienceLevel",
                    skillsRequired: "$job.skillsRequired",
                    salaryOffered: "$job.salaryOffered",
                    salaryPeriod: "$job.salaryPeriod",
                    salaryCurrency: "$job.salaryCurrency",
                },
                candidateSelected: {
                    _id: "$candidateSelected._id",
                    username: "$candidateSelected.username",
                    email: "$candidateSelected.email",
                },
                interviewer: {
                    _id: "$interviewer._id",
                    username: "$interviewer.username",
                    email: "$interviewer.email",
                },
                interviewerEvaluation: {
                    _id: "$interviewerEvaluation._id",
                    problemSolving: "$interviewerEvaluation.problemSolving",
                    communication: "$interviewerEvaluation.communication",
                    technicalKnowledge: "$interviewerEvaluation.technicalKnowledge",
                    confidence: "$interviewerEvaluation.confidence",
                    overallImpression: "$interviewerEvaluation.overallImpression",
                    totalScore: "$interviewerEvaluation.totalScore",
                    percentage: "$interviewerEvaluation.percentage",
                    recommendationNote: "$interviewerEvaluation.recommendationNote",
                    createdAt: "$interviewerEvaluation.createdAt",
                },
                aiEvaluations: {
                    $map: {
                        input: "$aiEvaluations",
                        as: "ai",
                        in: {
                            _id: "$$ai._id",
                            question: "$$ai.question",
                            candidateAnswer: "$$ai.candidateAnswer",
                            difficulty: "$$ai.difficulty",
                            accuracy: "$$ai.accuracy",
                            depth: "$$ai.depth",
                            clarity: "$$ai.clarity",
                            confidence: "$$ai.confidence",
                            totalScore: "$$ai.totalScore",
                            improvements: "$$ai.improvements",
                            createdAt: "$$ai.createdAt",
                        },
                    },
                },
            },
        },
    ]);

    if (!detailedReport.length) {
        throw new ApiError(404, "Detailed report not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Admin detailed report fetched successfully", detailedReport[0]));
});


