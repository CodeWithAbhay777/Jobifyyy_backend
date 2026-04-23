import mongoose from "mongoose";

const candidateProfileSchema = mongoose.Schema({

    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref : 'UserModel',
        required:true ,
        unique: true,
    },

    fullname: {
      type: String,
      required: true,
    },
    
    phone :{
        type:String,
        required : true
    },
    address : {
        type : String,
        required : true
    },
    college : {
        type : String
    },
    skills :{
        type : [String]
    },
    experience : {
        type : Number,
        default : 0
    },
    resume : {
        type : String,
        default : ""
    },
    bio : {
        type : String,
    },
    profilePhoto : {
        type : String,
        default: "",
    },
    linkedInProfile : {
        type : String,
        default: "",
    },
    githubProfile : {
        type : String,
        default: "",
    },
    


},{timestamps: true});

const CandidateProfileModel = mongoose.model("CandidateProfileModel", candidateProfileSchema);

export default CandidateProfileModel;