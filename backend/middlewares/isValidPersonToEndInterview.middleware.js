import { object } from "zod";
import InterviewModel from "../models/interview.model.js";
import UserModel from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import { parseISO, isAfter, isBefore, addHours } from "date-fns";


export const isValidPersonToEndInterview = asyncHandler(async(req, res, next) => {
    const {interviewId} = req.body;
    const userId = req.id;

    if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
        throw new ApiError(400, "Invalid Interview ID");
    }

    const interviewData = await InterviewModel.findById(interviewId);


    if(!interviewData){
        throw new ApiError(404, "Interview not found or you are not authorized to end this interview");
    }

    if (interviewData.interviewerAssigned.toString() !== userId ) {
        throw new ApiError(403, "You are not authorized to end this interview");
    }

    req.interviewData = interviewData;
    next();
})