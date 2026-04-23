import { z } from "zod";
import { objectIdValidator } from "./objectId.validator.js";

export const verifyEmailCodeSchemaValidator = z.object({
    email : z.string({ required_error: "Email is required" })
    .email("Please enter a valid email"),

    code : z.string({ required_error: "Code is required" })
    .min(6, "Code must be at least 6 characters long"),

    id : objectIdValidator,
})