import mongoose from "mongoose";

const interviewQuestionSchema = mongoose.Schema({
    field : {
        type : String,
        enum : ['frontend', 'backend', 'fullstack'],
        required : true,
    },
    question : {
        type : String,
        required : true,
    },
    difficulty : {
        type : String,
        enum : ['easy', 'medium', 'hard'],
        required : true,
    }
});

const InterviewQuestionModel = mongoose.model('InterviewQuestionModel', interviewQuestionSchema);

export default InterviewQuestionModel;