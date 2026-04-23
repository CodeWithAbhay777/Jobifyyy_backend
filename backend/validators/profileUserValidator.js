import { z } from "zod";
import { objectIdValidator } from "./objectId.validator.js";

export const interviewerProfileSchema = z.object({
  user_id: objectIdValidator,

  fullname: z.string().min(1, "Full name is required"),

  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),

  address: z.string().min(1, "Address is required"),

  designation: z.string().min(1, "Designation is required"),

  expertiseAreas: z
    .array(z.string().min(1))
    .min(1, "At least one area of expertise is required"),

  totalExperience: z
    .preprocess(
      (val) => Number(val),
      z.number().min(0, "Experience cannot be negative")
    )
    .optional(),

  linkedInProfile: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),

  profilePhoto: z.string().optional().or(z.literal("")),

  bio: z.string().optional(),

  isAvailableForInterview: z.boolean().optional(),

  preferredInterviewType: z
    .enum(["frontend", "backend", "fullstack"])
    .optional(),
});

export const candidateProfileSchema = z.object({
  user_id: objectIdValidator,

  fullname: z.string().min(1, "Full name is required"),

  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),

  address: z.string().min(1, "Address is required"),

  college: z.string().optional(),

  skills: z.array(z.string().min(1)).optional(),

  experience: z
    .preprocess(
      (val) => Number(val),
      z.number().min(0, "Experience cannot be negative")
    )
    .optional(),

  resume: z.string().optional().or(z.literal("")),

  bio: z.string().optional(),

  profilePhoto: z.string().optional().or(z.literal("")),

  linkedInProfile: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),

  githubProfile: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});
