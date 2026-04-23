import mongoose from "mongoose";


const interviewerEvaluationSchema = new mongoose.Schema({
    interviewId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'InterviewModel',
        required : true,
    },

    problemSolving : {
        type : Number,
        min : 0,
        max : 10,
        required : true,
    },

    communication : {
        type : Number,
        min : 0,
        max : 10,
        required : true,
    },

    technicalKnowledge : {
        type : Number,
        min : 0,
        max : 10,
        required : true,
    },

    confidence : {
        type : Number,
        min : 0,
        max : 10,
        required : true,
    },

    overallImpression : {
        type : Number,
        min : 0,
        max : 10,
        required : true,
    },

    totalScore : {
        type : Number,
        min : 0,
        max : 50,
        required : true,
    },

    percentage : {
        type : Number,
        min : 0,
        max : 100,
        required : true,
    },

    recommendationNote : {
        type : String,
        default : "",
    }
},{
    timestamps : true,
});


const InterviewerEvaluation = mongoose.model("InterviewerEvaluation" , interviewerEvaluationSchema);
export default InterviewerEvaluation;