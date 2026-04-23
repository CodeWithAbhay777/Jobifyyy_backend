import mongoose from "mongoose";
import ApplicationModel from "./application.model.js";
import InterviewModel from "./interview.model.js";

const jobSchema = mongoose.Schema({
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserModel',
    required: true,

  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['job', 'internship'],
    default: "job",
    required: true,
  },
  salaryOffered: {
    type: Number,
    required: true,
  },
  salaryPeriod: {
    type: String,
    enum: ["monthly", "yearly", "hourly"],
    default: "yearly",
  },
  salaryCurrency: {
    type: String,
    enum: ["INR", "USD", "EUR", "GBP"],
    default: "INR",
  },
  description: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    enum: ["software engineer", "backend developer", "frontend developer", "fullstack developer"],
    default: "software engineer",
    required: true,
  },
  skillsRequired: {
    type: [String]
  },
  experienceLevel: {
    type: String,
    enum: ["fresher", "junior", "mid", "senior", "lead"],
    default: "fresher",
  },
  openings: {
    type: Number,
    default: 1,
  },
  applicationDeadline: {
    type: Date,
  },

  isOpen: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const cascadeDeleteByJobIds = async (jobIds = []) => {
  if (!jobIds.length) return;

  await ApplicationModel.deleteMany({ job: { $in: jobIds } });
  await InterviewModel.deleteMany({ job: { $in: jobIds } });
};

jobSchema.pre("findOneAndDelete", async function (next) {
  const job = await this.model.findOne(this.getFilter()).select("_id").lean();
  if (!job) return next();

  await cascadeDeleteByJobIds([job._id]);
  next();
});

jobSchema.pre("deleteMany", async function (next) {
  const jobs = await this.model.find(this.getFilter()).select("_id").lean();
  const jobIds = jobs.map((job) => job._id);

  await cascadeDeleteByJobIds(jobIds);
  next();
});

jobSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  await cascadeDeleteByJobIds([this._id]);
  next();
});

jobSchema.pre("deleteOne", { document: false, query: true }, async function (next) {
  const job = await this.model.findOne(this.getFilter()).select("_id").lean();
  if (!job) return next();

  await cascadeDeleteByJobIds([job._id]);
  next();
});

const JobModel = mongoose.model("JobModel", jobSchema);

export default JobModel;