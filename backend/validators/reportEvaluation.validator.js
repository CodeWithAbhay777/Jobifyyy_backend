

import { z } from "zod";
import { objectIdValidator } from "./objectId.validator.js";

export const AIEvaluationSchema = z.object({
    question: z.string().min(1, "Question is required"),
    candidateAnswer: z.string().min(1, "Candidate answer is required"),
    difficulty: z.enum(['easy', 'medium', 'hard'], "Difficulty must be one of 'easy', 'medium', or 'hard'"),
    interviewId: objectIdValidator
});