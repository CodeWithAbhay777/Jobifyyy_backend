import {ApiError} from '../utils/ApiError.js';

export const errorHandler = (err, req, res, next) => {
  
  if (res.headersSent) return next(err);
  
  if (err instanceof ApiError) {
    return res.status(Number(err.statusCode)).json({
      success: err.success,
      message: err.message,
      status : err.statusCode,
    });
  }
  console.log("API ERROR NOT HIT", err);
  return res.status(500).json({
    success: false,
    message: "ApiError Missed : Internal Server Error",
  });
};
