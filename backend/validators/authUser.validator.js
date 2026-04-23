import { z } from "zod";

export const signupSchemaValidator = z.object({
  username: z
    .string({ required_error: "Username is required" })
    .trim()
    .min(1, "Username cannot be empty"),

  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email"),

  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters long"),

  role: z
    .enum(["admin", "candidate", "recruiter"], {
      errorMap: () => ({
        message: "Role must be admin, candidate, or recruiter",
      }),
    })
    .default("candidate"),
});

export const loginSchemaValidator = z.object({
  emailOrUsername: z
    .string({ required_error: "Email or username is required" })
    .trim()
    .min(1, "Email or username cannot be empty"),

  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters long"),

  role: z.enum(["admin", "candidate", "recruiter"], {
    required_error: "Role is required",
    invalid_type_error: "Role must be admin, candidate, or recruiter",
  }),
});
