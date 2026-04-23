import express from 'express';
import { getCandidateProfile, submitCandidateProfile } from '../controllers/candidateProfile.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
import { getRecruiterOrAdminProfile, submitRecruiterProfile } from '../controllers/recruiterProfile.controller.js';
import{  candidateProfileSchema, interviewerProfileSchema } from '../validators/profileUserValidator.js';
import validate from '../middlewares/validate.js';

const router = express.Router();

//candidate
router.post('/candidate',isAuthenticated  ,upload.fields([{name : "profilePhoto", maxCount : 1} , {name : "resume" , maxCount : 1}]) , validate(candidateProfileSchema),submitCandidateProfile)
router.get('/candidate' , isAuthenticated ,getCandidateProfile);


//recruiter
router.post('/recruiter' , isAuthenticated, upload.fields([{name : "profilePhoto" , maxCount : 1}])  ,validate(interviewerProfileSchema), submitRecruiterProfile );
router.get('/recruiter' , isAuthenticated , getRecruiterOrAdminProfile );

export default router;