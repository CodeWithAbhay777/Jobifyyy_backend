import { object } from "zod";
import InterviewModel from "../models/interview.model.js";
import UserModel from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { parseISO, isAfter, isBefore, addHours } from "date-fns";



export const isValidPersonForInterview = asyncHandler(async(req, res, next) => {
    const {interviewId} = req.body;
    console.log(interviewId);
    
    // Validate interviewId exists
    if (!interviewId) {
        return res.status(400).json({ message: "Interview ID is required" });
    }

    // Validate interviewId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
        return res.status(400).json({ message: "Invalid Interview ID format" });
    }

    const interviewData = await InterviewModel.findById(interviewId);

    if(!interviewData){
        return res.status(404).json({message: "Interview not found"});
    }

    // scheduledAt is already a Date object from MongoDB, no need to parse
    const scheduledTimeForInterview = new Date(interviewData.scheduledAt);
    const currentTime = new Date();
    const endTime = addHours(scheduledTimeForInterview, 3360); // Assuming 3360-minute interview duration

    if (!isAfter(currentTime, scheduledTimeForInterview))  {
        return res.status(403).json({ message: "Interview is not started yet" });
    }

    if (!isBefore(currentTime, endTime)){
        return res.status(403).json({ message: "Interview has already ended" });
    }

    const userId = req.id;

    const userData = await UserModel.findById(userId);

    if (!userData) {
        return res.status(404).json({ message: "User not found" });
    }

    if (userData.role === 'candidate' && interviewData.candidateSelected.toString() !== userId.toString()) {
        return res.status(403).json({ message: "You are not a valid candidate for this interview" });
    }

    if ((userData.role === 'recruiter' || userData.role === 'admin') && interviewData.interviewerAssigned.toString() !== userId.toString()) {
        return res.status(403).json({ message: "You are not a valid interviewer for this interview" });
    }

    //check for isInterviewerJoined
    if (userData.role === 'candidate' && !interviewData.isInterviewerJoined) {
        return res.status(403).json({ message: "Interviewer has not joined yet. Please wait for the interviewer to join." });
    }

    req.interviewData = interviewData;
    req.userData = userData;
    next();
    

});