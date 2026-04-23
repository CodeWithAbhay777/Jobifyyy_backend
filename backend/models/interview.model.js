import mongoose from "mongoose";
import AIEvaluation from "./AIEvaluation.model.js";
import InterviewerEvaluation from "./InterviewerEvaluation.model.js";
import FinalReportModel from "./finalReport.model.js";

const interviewSchema = mongoose.Schema({

   job : {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'JobModel',
    required : true,
   },

   candidateSelected : {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'UserModel',
    required : true,
   },

   interviewerAssigned : {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'UserModel',
    required : true,
   },
   interviewType : {
    type : String,
    enum : ['frontend', 'backend', 'fullstack'],
    required : true,
   },
   scheduledAt : {
    type : Date,
    required : true,
    default: Date.now(),
   },

   notes : {
      type : String,
      default : "",
      
   },

   status : {
    type : String,
    enum : ['scheduled' , 'completed' , 'cancelled'],
    default : 'scheduled',
   },

   isCandidateSelected : {
      type : String,
      enum : ['pending', 'selected'],
      default : 'pending',
   },

   isScoreGiven : {
    type : Boolean,
    default : false,
   },

   currentlyRunning : {
    type : Boolean,
    default : false,
   },

   isInterviewerJoined : {
      type : Boolean,
      default : false,
   },

   roomId : {
      type : String,
      required : false,
      default : "",
   }

});

const cascadeDeleteByInterviewIds = async (interviewIds = []) => {
   if (!interviewIds.length) return;

   await AIEvaluation.deleteMany({ interview_Id: { $in: interviewIds } });
   await InterviewerEvaluation.deleteMany({ interviewId: { $in: interviewIds } });
   await FinalReportModel.deleteMany({ interviewId: { $in: interviewIds } });
};

interviewSchema.pre("findOneAndDelete", async function (next) {
   const interview = await this.model.findOne(this.getFilter()).select("_id").lean();
   if (!interview) return next();

   await cascadeDeleteByInterviewIds([interview._id]);
   next();
});

interviewSchema.pre("deleteMany", async function (next) {
   const interviews = await this.model.find(this.getFilter()).select("_id").lean();
   const interviewIds = interviews.map((interview) => interview._id);

   await cascadeDeleteByInterviewIds(interviewIds);
   next();
});

interviewSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
   await cascadeDeleteByInterviewIds([this._id]);
   next();
});

interviewSchema.pre("deleteOne", { document: false, query: true }, async function (next) {
   const interview = await this.model.findOne(this.getFilter()).select("_id").lean();
   if (!interview) return next();

   await cascadeDeleteByInterviewIds([interview._id]);
   next();
});

const InterviewModel = mongoose.model("InterviewModel", interviewSchema);

export default InterviewModel;