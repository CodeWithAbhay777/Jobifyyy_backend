import InterviewerEvaluation from "../models/InterviewerEvaluation.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const isAlreadyEvaluated = asyncHandler(async(req , res , next) => {
    const {interviewId} = req.body;

    // Check if the interview has already been evaluated by interviewer
    const interviewerEvaluation = await InterviewerEvaluation.findOne({ interviewId });

    if (interviewerEvaluation) {
        throw new ApiError(400 , "This candidate has already been evaluated by the interviewer");
    }
    next();

});