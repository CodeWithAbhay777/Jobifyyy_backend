import mongoose from "mongoose";

const interviewerProfileSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
      unique: true,
    },

    fullname: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required : true,
    },


    designation: {
      type: String,
      required: true,
    },

    expertiseAreas: {
      type: [String], 
      required: true,
    },

    totalExperience: {
      type: Number, // in years
      default: 0,
    },

    linkedInProfile: {
      type: String,
      default: "",
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
    },

    isAvailableForInterview: {
      type: Boolean,
      default: true,
    },
    preferredInterviewType: {
      type: String,
      enum: ["frontend", "backend", "fullstack"],
      default: "fullstack",
    },

  },
  { timestamps: true }
);

const InterviewerProfileModel = mongoose.model(
  "InterviewerProfileModel",
  interviewerProfileSchema
);

export default InterviewerProfileModel;
