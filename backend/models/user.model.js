import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import CandidateProfileModel from "./candidateProfile.model.js";
import InterviewerProfileModel from "./interviewerProfile.model.js";
import ApplicationModel from "./application.model.js";
import JobModel from "./jobs.model.js";

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      index: true,
      trim: true,
    },
    
    email: {
      type: String,
      required: true,
      unique: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    password: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },

    isProfileComplete: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["admin", "candidate", "recruiter"],
      default: "candidate",
      required: true,
    },
  },
  { timestamps: true }
);


//this is a middleware function that hashes the password before saving the user document
userSchema.pre("save",async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password , 10);
  }
  next();
});


//Method for checking is password correct or not
userSchema.methods.isPasswordCorrect = async function(password) {
  return await bcrypt.compare(password, this.password);
}

//Method for generating refresh tokens
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        userId : this._id,
        
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
       expiresIn : process.env.REFRESH_TOKEN_EXPIRY || "14d" 
    });
}


//Method for generating access tokens
userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        userId : this._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
       expiresIn : process.env.ACCESS_TOKEN_EXPIRY || "1d" 
    });
}

const cascadeDeleteByUsers = async (users = []) => {
  if (!users.length) return;

  const userIds = users.map((user) => user._id);
  const candidateIds = users
    .filter((user) => user.role === "candidate")
    .map((user) => user._id);
  const recruiterOrAdminIds = users
    .filter((user) => user.role === "recruiter" || user.role === "admin")
    .map((user) => user._id);

  await CandidateProfileModel.deleteMany({ user_id: { $in: userIds } });
  await InterviewerProfileModel.deleteMany({ user_id: { $in: userIds } });

  if (candidateIds.length) {
    await ApplicationModel.deleteMany({ candidateApplied: { $in: candidateIds } });
  }

  if (recruiterOrAdminIds.length) {
    await JobModel.deleteMany({ postedBy: { $in: recruiterOrAdminIds } });
  }
};

userSchema.pre("findOneAndDelete", async function (next) {
  const user = await this.model.findOne(this.getFilter()).select("_id role").lean();
  if (!user) return next();

  await cascadeDeleteByUsers([user]);
  next();
});

userSchema.pre("deleteMany", async function (next) {
  const users = await this.model.find(this.getFilter()).select("_id role").lean();

  await cascadeDeleteByUsers(users);
  next();
});

userSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  await cascadeDeleteByUsers([{ _id: this._id, role: this.role }]);
  next();
});

userSchema.pre("deleteOne", { document: false, query: true }, async function (next) {
  const user = await this.model.findOne(this.getFilter()).select("_id role").lean();
  if (!user) return next();

  await cascadeDeleteByUsers([user]);
  next();
});



const UserModel = mongoose.model("UserModel", userSchema);

export default UserModel;
