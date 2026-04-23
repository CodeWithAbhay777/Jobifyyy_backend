import express from 'express';
import { sendVerificationCode, verifyEmailCode } from '../controllers/emailVerification.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.middleware.js';
import validate from '../middlewares/validate.js';
import { verifyEmailCodeSchemaValidator } from '../validators/verifyEmail.validator.js';

const router = express.Router();


router.get('/verify', isAuthenticated , sendVerificationCode);
router.post('/verify', isAuthenticated , validate(verifyEmailCodeSchemaValidator) , verifyEmailCode);
    
export default router;