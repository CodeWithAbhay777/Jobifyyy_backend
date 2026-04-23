import { z } from "zod";
import mongoose from "mongoose";

export const objectIdValidator = z
  .string({ required_error: "_id is required" })
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
});