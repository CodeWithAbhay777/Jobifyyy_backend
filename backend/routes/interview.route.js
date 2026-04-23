import express from 'express';
import { 
  scheduleInterview, 
  getAllInterviewsOfJob, 
  updateInterviewStatus, 
  getInterviewById, 
  getAllInterviews,
  getAllCandidateInterviews,
  getAllRecruiterInterviews,
  shortlistCandidateForInterview,
  updateInterviewDetails
} from '../controllers/interview.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.middleware.js';
import { isAdmin } from '../middlewares/isAdmin.middleware.js';
import validate from '../middlewares/validate.js';
import { scheduleInterviewSchema, updateInterviewDetailsSchema } from '../validators/interview.validator.js';

const router = express.Router();

// Interview routes
router.get('/', isAuthenticated , isAdmin , getAllInterviews);
router.post('/schedule', isAuthenticated, isAdmin, validate(scheduleInterviewSchema), scheduleInterview);
router.put('/edit/:id', isAuthenticated, isAdmin, validate(updateInterviewDetailsSchema), updateInterviewDetails);
router.get('/all', isAuthenticated, isAdmin, getAllInterviewsOfJob);

//candidates can see their interviews and recruiters can see the interviews they are conducting
router.get('/candidate' , isAuthenticated, getAllCandidateInterviews);
router.get('/recruiter' , isAuthenticated, getAllRecruiterInterviews);
// interviewers can see their interviews

router.get('/:id', isAuthenticated, getInterviewById);
router.put('/:id/status', isAuthenticated, isAdmin, updateInterviewStatus);

//Shortlist Candidates for interview
router.put('/:id/shortlist' , isAuthenticated , isAdmin , shortlistCandidateForInterview);

export default router;