import express from 'express';
import isAuthenticated from '../middlewares/isAuthenticated.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
import validate from '../middlewares/validate.js';
import { applicationSchema } from '../validators/applicationSchema.validator.js';
import { submitApplication } from '../controllers/application.controller.js';
import { isCandidate } from '../middlewares/isCandidate.middleware.js';

const router = express.Router();

// Route to submit a job application
router.post('/apply', isAuthenticated , isCandidate , upload.single('resume'), validate(applicationSchema), submitApplication);


export default router;