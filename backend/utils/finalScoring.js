import FinalReportModel from "../models/finalReport.model.js";
import AIEvaluation from "../models/AIEvaluation.model.js";
import { scoreWeights } from './contants.js';


const calculateTotalScore = async(payload) => {

    try {

        const { percentage, interviewId } = payload;

        const aiEvaluationData = await AIEvaluation.find({ interview_Id: interviewId });

        let aiScorePercentage = 0;
        let maxAIscore = 0;

        if (aiEvaluationData.length === 0) {
            aiScorePercentage = null; // better than 0 (means "no AI data")
        } else {
            for (let i = 0; i < aiEvaluationData.length; i++) {
                const aiEval = aiEvaluationData[i];
                const weight = scoreWeights.difficultyWeight[aiEval.difficulty] || 1;

                const weightedScore = aiEval.totalScore * weight;
                maxAIscore += 40 * weight;

                aiScorePercentage += weightedScore;
            }

            aiScorePercentage = (aiScorePercentage / maxAIscore) * 100;
        }

        const interviewerScorePercentage = percentage;

        let finalScore;

        if (aiScorePercentage === null) {
            finalScore = interviewerScorePercentage; // pure human
        } else {
            const confidenceWeight = Math.min(1, aiEvaluationData.length / scoreWeights.idealQuestions);

            const effectiveAiWeight = scoreWeights.finalWeight.AI * confidenceWeight;
            const effectiveInterviewerWeight = scoreWeights.finalWeight.recruiter;

            const totalOfEffectiveWeights = effectiveAiWeight + effectiveInterviewerWeight;

            const finalAIWeight = effectiveAiWeight / totalOfEffectiveWeights;
            const finalInterviewerWeight = effectiveInterviewerWeight / totalOfEffectiveWeights;

            finalScore = (aiScorePercentage * finalAIWeight) + (interviewerScorePercentage * finalInterviewerWeight);
        }


        const finalReportData = {
            interviewId,
            aiScorePercentage : aiScorePercentage !== null ? Number(aiScorePercentage.toFixed(2)) : 0,
            interviewerScorePercentage : Number(interviewerScorePercentage.toFixed(2)),
            finalScore : Number(finalScore.toFixed(2))
        };

        console.log("finalReportData : ", finalReportData);


        const finalReport = new FinalReportModel(finalReportData);
        await finalReport.save();


    } catch (error) {
        console.log('errrrrrrroorrrrr -> ', error.message);
    }


}

export default calculateTotalScore;