import mongoose from "mongoose";

const finalReportSchema = new mongoose.Schema({
    interviewId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'InterviewModel',
        required : true,
    },

    aiScorePercentage : {
        type : Number,
        min : 0,
        max : 100,
        required : true,
    },

    interviewerScorePercentage : {
        type : Number,
        min : 0,
        max : 100,
        required : true,
    },

    finalScore : {
        type : Number,
        min : 0,
        max : 100,
        required : true,
    }
},{
    timestamps : true,
});


const FinalReportModel = mongoose.model("FinalReportModel", finalReportSchema);
export default FinalReportModel;