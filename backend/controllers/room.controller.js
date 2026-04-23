import { asyncHandler } from "../utils/asyncHandler.js";
import { StreamClient } from "@stream-io/node-sdk";
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from "../utils/ApiError.js";
import ApplicationModel from "../models/application.model.js";
import InterviewModel from "../models/interview.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import InterviewQuestionModel from "../models/interviewQuestions.model.js";
import runCode from "../utils/runCode.js";



const sdk = new StreamClient(process.env.STREAM_API_KEY, process.env.STREAM_API_SECRET);


export const getRoomToken = asyncHandler(async (req, res) => {
    const { interviewData, userData } = req;

    let roomIdInitialization;
    let interviewQuestions;

    if (userData.role === 'recruiter' || userData.role === 'admin') {

        if (!interviewData.roomId || interviewData.roomId === "") {
            roomIdInitialization = uuidv4();
            await InterviewModel.findByIdAndUpdate(interviewData._id, { isInterviewerJoined: true, currentlyRunning: true, roomId: roomIdInitialization });
        } else {
            await InterviewModel.findByIdAndUpdate(interviewData._id, { isInterviewerJoined: true, currentlyRunning: true });
        }

        if (interviewData.interviewType) {
            interviewQuestions = await InterviewQuestionModel.find({ field: interviewData.interviewType });
        }
    }

    const application = await ApplicationModel.findOne({
        job: interviewData.job,
        candidateApplied: interviewData.candidateSelected,
    });

    if (!application) {
        throw new ApiError(404, "Application not found for the interview");
    }
    const expirationHours = 168; // 168 hours 
    const exp = Math.floor(Date.now() / 1000) + (expirationHours * 60 * 60);
    const token = sdk.generateUserToken({ user_id: userData._id, exp: exp });

    if (!token) {
        throw new ApiError(500, "Failed to generate room token");
    }

    let userInfoForRoom;

    if (interviewQuestions && interviewQuestions.length > 0 && (userData.role === 'recruiter' || userData.role === 'admin')) {
        
        userInfoForRoom = {

            id: userData._id,
            email: userData.email,
            role: userData.role,
            roomId: interviewData.roomId || roomIdInitialization,
            token: token,
            interviewId: interviewData._id,
            resumeUrl: application.applicationResume,
            interviewQuestions: interviewQuestions

        };
    } else {

        userInfoForRoom = {
            id: userData._id,
            email: userData.email,
            role: userData.role,
            roomId: interviewData.roomId || roomIdInitialization,
            token: token,
            interviewId: interviewData._id,
            resumeUrl: application.applicationResume,

        };

    }



    res.status(200).json(new ApiResponse(200, "Room token generated successfully", userInfoForRoom));


});


export const runCodeInInterview = asyncHandler(async (req, res) => {
    const { source_code, language_id } = req.body;

    if (!source_code || !language_id) {
        throw new ApiError(400, "Source code and language ID are required");
    }

    
    const result = await runCode(source_code, language_id);

    if (!result.success) {
        throw new ApiError(500, result.error || "Code execution failed");
    }

    res.status(200).json(new ApiResponse(200, "Code executed successfully", result.response));
});


export const endInterview = asyncHandler(async (req , res) => {
    const { interviewData } = req;

    await InterviewModel.findByIdAndUpdate(interviewData._id, { currentlyRunning: false , isInterviewerJoined: false , status : "completed" });

    await ApplicationModel.findOneAndUpdate(
        { job: interviewData.job, candidateApplied: interviewData.candidateSelected },
        { status: "interview-completed" }
    );
    res.status(200).json(new ApiResponse(200, "Interview ended successfully"));
});
