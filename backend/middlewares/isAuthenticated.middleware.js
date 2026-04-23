import jwt from "jsonwebtoken";
import { checkForRefreshToken } from "../utils/checkForRefreshToken.js";
import { ApiError } from "../utils/ApiError.js";

const isAuthenticated = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.jobify_access_token;
    const refreshToken = req.cookies?.jobify_refresh_token;

    if (!accessToken && !refreshToken) {
      throw new ApiError(401, "Unauthorized request : No token found");
    }

    if (!accessToken) {
      return await checkForRefreshToken(refreshToken, req, res, next);
    }

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    req.id = decoded.userId;


    next();
  } catch (error) {

    throw new ApiError(
      401,
      error?.message || "Unauthorized request : Invalid access token"
    );
  }

};

export default isAuthenticated;
