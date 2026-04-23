import express from 'express';

import { register , login , logout , me , getAllInterviewers } from '../controllers/user.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.middleware.js';
import validate from '../middlewares/validate.js';
import { loginSchemaValidator, signupSchemaValidator } from '../validators/authUser.validator.js';
import { isAdmin } from '../middlewares/isAdmin.middleware.js';

const router = express.Router();

//auth routes
router.post('/register' ,validate(signupSchemaValidator), register);
router.post('/login', validate(loginSchemaValidator), login);
router.post('/logout' , isAuthenticated , logout);
router.get('/me' , isAuthenticated , me);
router.get('/interviewers' , isAuthenticated , isAdmin , getAllInterviewers);


export default router;