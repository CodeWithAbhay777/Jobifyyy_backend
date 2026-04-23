import { z } from "zod";
import { objectIdValidator } from "./objectId.validator.js";

export const interviewerScoresSchema = z.object({
  interviewId: objectIdValidator,

  scores: z.object({
    problemSolving: z.preprocess(
      (val) => Number(val),
      z.number().min(0, "Problem solving score must be at least 0").max(10, "Problem solving score must be at most 10")
    ),
    communication: z.preprocess(
      (val) => Number(val),
      z.number().min(0, "Communication score must be at least 0").max(10, "Communication score must be at most 10")
    ),
    technicalKnowledge: z.preprocess(
      (val) => Number(val),
      z.number().min(0, "Technical knowledge score must be at least 0").max(10, "Technical knowledge score must be at most 10")
    ),
    confidence: z.preprocess(
      (val) => Number(val),
      z.number().min(0, "Confidence score must be at least 0").max(10, "Confidence score must be at most 10")
    ),
    overallImpression: z.preprocess(
      (val) => Number(val),
      z.number().min(0, "Overall impression score must be at least 0").max(10, "Overall impression score must be at most 10")
    ),
  }),

  totalScore: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "Total score must be non-negative")
  ),

  maxScore: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "Max score must be greater than zero")
  ),

  percentage: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "Percentage must be at least 0").max(100, "Percentage must be at most 100")
  ),

  recommendation: z
    .string()
    .trim()
    .optional()
    .nullable(),
});
