import express from 'express';


import isAuthenticated from '../middlewares/isAuthenticated.middleware.js';
import validate from '../middlewares/validate.js';
import { isAdmin } from '../middlewares/isAdmin.middleware.js';
import { jobSchema , editJobSchema } from '../validators/jobs.Validator.js';
import {createJob, getAllJobsByAdmin, getJobsForCandidates , getIndividualJob, getJobInfoByAdmin, getIndividualJobForAdmin, editJob, deleteJob} from '../controllers/jobs.controller.js';

const router = express.Router();

//admin posting job
router.post('/create' , isAuthenticated , isAdmin , validate(jobSchema) ,  createJob );
router.put('/edit/:id', isAuthenticated , isAdmin , validate(editJobSchema) , editJob );
router.delete('/delete/:id', isAuthenticated , isAdmin , deleteJob );
router.get('/admin', isAuthenticated , isAdmin , getAllJobsByAdmin );
router.get('/admin/:id' , isAuthenticated , isAdmin , getIndividualJobForAdmin );
router.get('/admin/:id/applications' , isAuthenticated , isAdmin , getJobInfoByAdmin );


//candidate jobs
router.get('/list' , getJobsForCandidates );
router.get('/:id' , isAuthenticated , getIndividualJob );

export default router;