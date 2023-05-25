const mongoose = require('mongoose');
let validator = require('validator');


const authSchema = new mongoose.Schema({
    email: {
        required : true,
        type:String,
        unique: true,
        lowercase: true,
        validate: (value) => {
            return validator.isEmail(value);
        }
    },
    password: {
        required : true,
        type:String
    },
    authorizeTo : {
        required : true,
        type:String,
        default : "developer"
    },
    token: { 
        type: String 
    }
  }, { timestamps: true });

const authModel = mongoose.model("authentication",authSchema);

module.exports = authModel;