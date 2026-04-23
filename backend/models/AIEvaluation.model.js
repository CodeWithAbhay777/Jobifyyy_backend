import mongoose from "mongoose";

const aiEvaluationSchema = new mongoose.Schema({
    interview_Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewModel",
        required: true
    },

    question: {
        type: String,
        required: true
    },
    candidateAnswer: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        required: true
    },
    accuracy: {
        type: Number,
        min: 0,
        max: 10
    },
    depth: {
        type: Number,
        min: 0,
        max: 10
    },
    clarity: {
        type: Number,
        min: 0,
        max: 10
    },
    confidence: {
        type: Number,
        min: 0,
        max: 10
    },
    totalScore: {
        type: Number,
        min: 0,
        max: 40
    },
    improvements: {
        type: [String]
    }
}, {
    timestamps: true
});

const AIEvaluation = mongoose.model("AIEvaluation", aiEvaluationSchema);
export default AIEvaluation;