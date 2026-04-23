import express from 'express'; 
import isAuthenticated from '../middlewares/isAuthenticated.middleware.js';
import { isValidPersonForInterview } from '../middlewares/isValidPersonForInterview.js';
import { endInterview, getRoomToken, runCodeInInterview } from '../controllers/room.controller.js';
import { limiter } from '../middlewares/rateLimiting.middleware.js';
import { isValidPersonToEndInterview } from '../middlewares/isValidPersonToEndInterview.middleware.js';

const router = express.Router();

router.post('/interview/token', isAuthenticated, isValidPersonForInterview, getRoomToken);
router.post('/interview/codeExecution' , limiter , isAuthenticated, runCodeInInterview);
router.post('/interview/end' , isAuthenticated , isValidPersonToEndInterview , endInterview);


export default router;