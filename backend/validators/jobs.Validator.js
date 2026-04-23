import { z } from "zod";
import { objectIdValidator } from "./objectId.validator.js";

export const jobSchema = z.object({

  postedBy: objectIdValidator,
  
  title: z.string().min(1, "Job title is required"),

  type: z.enum(["job", "internship"], {
    errorMap: () => ({ message: "Type must be either 'job' or 'internship'" }),
  }),

  salaryOffered: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "Salary must be non-negative")
  ),

  salaryPeriod: z.enum(["hourly", "monthly", "yearly"], {
    errorMap: () => ({ message: "Salary period must be hourly, monthly, or yearly" }),
  }),

  salaryCurrency: z.enum(["INR", "USD", "EUR", "GBP"], {
    errorMap: () => ({ message: "Salary currency must be INR, USD, EUR, or GBP" }),
  }),

  description: z.string().min(1, "Job description can't be empty"),

  department: z.enum(["software engineer" , "backend developer" , "frontend developer" , "fullstack developer"], {
    errorMap: () => ({ message: "Department must be one of engineering, design, marketing, sales, hr" }),
  }),

  skillsRequired: z
    .array(z.string().min(1, "Skill cannot be empty"))
    .min(1, "At least one skill is required"),

  experienceLevel: z.enum(["fresher", "junior", "mid", "senior", "lead"], {
    errorMap: () => ({ message: "Experience level must be one of fresher, junior, mid, senior, lead" }),
  }),

  openings: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "There must be at least one opening")
  ),

  applicationDeadline: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    "Application deadline must be a valid date"
  ),
});


export const editJobSchema = z.object({
  postedBy: objectIdValidator.optional(),

  title: z.string().min(1, "Job title is required").optional(),

  type: z.enum(["job", "internship"], {
    errorMap: () => ({ message: "Type must be either 'job' or 'internship'" }),
  }).optional(),

  salaryOffered: z.preprocess(
    (val) => (val === undefined ? undefined : Number(val)),
    z.number().min(0, "Salary must be non-negative")
  ).optional(),

  salaryPeriod: z.enum(["hourly", "monthly", "yearly"], {
    errorMap: () => ({ message: "Salary period must be hourly, monthly, or yearly" }),
  }).optional(),

  salaryCurrency: z.enum(["INR", "USD", "EUR", "GBP"], {
    errorMap: () => ({ message: "Salary currency must be INR, USD, EUR, or GBP" }),
  }).optional(),

  description: z.string().min(1, "Job description can't be empty").optional(),

  department: z.enum(["software engineer", "backend developer", "frontend developer", "fullstack developer"], {
    errorMap: () => ({ message: "Department must be one of engineering, design, marketing, sales, hr" }),
  }).optional(),

  skillsRequired: z
    .array(z.string().min(1, "Skill cannot be empty"))
    .min(1, "At least one skill is required")
    .optional(),

  experienceLevel: z.enum(["fresher", "junior", "mid", "senior", "lead"], {
    errorMap: () => ({ message: "Experience level must be one of fresher, junior, mid, senior, lead" }),
  }).optional(),

  openings: z.preprocess(
    (val) => (val === undefined ? undefined : Number(val)),
    z.number().min(1, "There must be at least one opening")
  ).optional(),

  applicationDeadline: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    "Application deadline must be a valid date"
  ).optional(),

  isOpen: z.boolean().optional(),
});
