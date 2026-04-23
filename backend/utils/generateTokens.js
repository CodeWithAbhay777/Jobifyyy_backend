import jwt from 'jsonwebtoken';
import UserModel from '../models/user.model.js';
import { success } from 'zod';

export const generateAccessAndRefereshTokens  = (user) => {
    try {

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        if (!accessToken || !refreshToken) {
            return {
                success: false,
                message: "Error generating tokens",
            };
        }

        return {
            success : true,
            accessToken,
            refreshToken
        };
        
    } catch (error) {
        return {
            success: false,
            message: "Error generating tokens",
        }
    }
}