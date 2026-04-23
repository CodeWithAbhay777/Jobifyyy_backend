import mongoose from "mongoose";
import InterviewModel from "./interview.model.js";

const applicationSchema = mongoose.Schema({

   job : {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'JobModel',
    required : true,
   },

   candidateApplied : {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'UserModel',
    required : true,
   },

   status : {
    type : String,
    enum : ['applied' , 'interview-scheduled', 'interview-completed'],
    default : 'applied'
   },

   coverLetter : {
      type : String,
      default : '',
      required : false,
   },

   applicationResume : {
      type : String,
      default : '',
      required : false,
   }


},{timestamps: true});

const cascadeDeleteByApplications = async (applications = []) => {
  if (!applications.length) return;

  const interviewConditions = applications
    .filter((application) => application.job && application.candidateApplied)
    .map((application) => ({
      job: application.job,
      candidateSelected: application.candidateApplied,
    }));

  if (!interviewConditions.length) return;

  await InterviewModel.deleteMany({ $or: interviewConditions });
};

applicationSchema.pre("findOneAndDelete", async function (next) {
  const application = await this.model
    .findOne(this.getFilter())
    .select("job candidateApplied")
    .lean();

  if (!application) return next();

  await cascadeDeleteByApplications([application]);
  next();
});

applicationSchema.pre("deleteMany", async function (next) {
  const applications = await this.model
    .find(this.getFilter())
    .select("job candidateApplied")
    .lean();

  await cascadeDeleteByApplications(applications);
  next();
});

applicationSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  await cascadeDeleteByApplications([{ job: this.job, candidateApplied: this.candidateApplied }]);
  next();
});

applicationSchema.pre("deleteOne", { document: false, query: true }, async function (next) {
  const application = await this.model
    .findOne(this.getFilter())
    .select("job candidateApplied")
    .lean();

  if (!application) return next();

  await cascadeDeleteByApplications([application]);
  next();
});

const ApplicationModel = mongoose.model("ApplicationModel", applicationSchema);

export default ApplicationModel;