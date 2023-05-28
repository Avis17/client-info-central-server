
const mongoose = require('mongoose');

const appCategorySchema = new mongoose.Schema({
    application_category : {
        required : true,
        type:String,
        unique: true,
        lowercase: true
    }
  }, { timestamps: true });

const appCategoryModel = mongoose.model("app_categories",appCategorySchema);

module.exports = appCategoryModel;