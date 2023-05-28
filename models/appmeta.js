
const mongoose = require('mongoose');

const table_fields_schema = new mongoose.Schema({
    field_name : {
        required : true,
        type:String,
    },
    field_key : {
        required : true,
        type:String,
    },
    field_type:{
        required : true,
        type:String,
    },
    field_value : {
        required : true,
        type:String,
    },
    isField_table_show : {
        required : true,
        type:Boolean,
    },
    isField_detailed_show :{
        required : true,
        type:Boolean,
    },
    isMutable : {
        required : true,
        type:Boolean,
    },
    isUnique : {
        required : true,
        type:Boolean,
    }

  });
const appMetaSchema = new mongoose.Schema({
    company_name : {
        required : true,
        type:String,
        unique: true,
    },
    company_email : {
        required : true,
        type:String,
        unique: true,
        lowercase: true
    },
    application_name : {
        required : true,
        type:String,
        unique: true,
    },
    application_category :{
        required : true,
        type:String,
    },
    application_table_required : {
        required : true,
        type:Boolean,
    },
    application_charts_required: {
        required : true,
        type:Boolean,
    },
    table_fileds : [
        table_fields_schema
    ]
  }, { timestamps: true });

const appMetaModel = mongoose.model("app_meta_objects",appMetaSchema);

module.exports = appMetaModel;