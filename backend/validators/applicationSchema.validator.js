import { z } from "zod";
import { objectIdValidator } from "./objectId.validator.js";


export const applicationSchema = z.object({
  jobId: objectIdValidator,
  
  coverLetter: z
    .string()
    .min(1, "Cover letter cannot be empty")
    .max(5000, "Cover letter is too long, maximum 5000 characters allowed")
    .optional(),
  
  useExistingResume: z
    .enum(["true", "false"], {
      required_error: "Please specify whether to use existing resume",
      invalid_type_error: "useExistingResume must be either 'true' or 'false'",
    })
    .transform((val) => val === "true"),
    
  resumeUrl: z
    .string()
    .optional(),
}).refine((data) => {
  // If using existing resume, resumeUrl must be provided
  if (data.useExistingResume) {
    return !!data.resumeUrl;
  }
  // Otherwise, no additional validation needed here as file will be checked by multer
  return true;
}, {
  message: "Resume URL is required when using an existing resume",
  path: ["resumeUrl"],
}).superRefine((data, ctx) => {
  // Only validate resumeUrl if useExistingResume is true
  if (data.useExistingResume) {
    if (!data.resumeUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Resume URL is required when using an existing resume",
        path: ["resumeUrl"],
      });
      return;
    }
    
    // Validate the URL format
    try {
      new URL(data.resumeUrl);
    } catch (err) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Resume URL must be a valid URL",
        path: ["resumeUrl"],
      });
    }
  }
});
