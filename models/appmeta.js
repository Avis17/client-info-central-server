
const mongoose = require('mongoose');

const table_fields_schema = new mongoose.Schema({
    field_name: {
        required: true,
        type: String,
    },
    field_key: {
        required: true,
        type: String,
    },
    field_type: {
        required: true,
        type: String,
    },
    field_value: {
        required: true,
        type: String,
    },
    isField_table_show: {
        required: false,
        type: Boolean,
    },
    isField_detailed_show: {
        required: false,
        type: Boolean,
    },
    isMutable: {
        required: true,
        type: Boolean,
    },
    isUnique: {
        required: true,
        type: Boolean,
    },
    isRequired: {
        required: false,
        type: String,
    },
    field_options: {
        required: false,
        type: Array,
    },
    isField_table_sorting: {
        required: false,
        type: Boolean,
    }

});

const chart_fields_schema = new mongoose.Schema({
    chart_type: {
        required: true,
        type: String,
    },
    chart_field_name: {
        required: true,
        type: String,
    }
})
const serviceFieldsSchema = new mongoose.Schema({
    service_name: {
        required: true,
        type: String,
    },
    service_price: {
        required: true,
        type: Number,
    }
})

const appMetaSchema = new mongoose.Schema({
    company_name: {
        required: true,
        type: String,
        unique: true,
    },
    company_email: {
        required: true,
        type: String,
        unique: true,
        lowercase: true
    },
    application_name: {
        required: true,
        type: String,
        unique: true,
    },
    application_category: {
        required: true,
        type: String,
    },
    client_name: {
        required: true,
        type: String,
    },
    application_table_required: {
        required: true,
        type: Boolean,
    },
    application_charts_required: {
        required: true,
        type: Boolean,
    },
    servicesList: [
        serviceFieldsSchema
    ],
    billingdetails: {
        signature: {
            required: true,
            type: String,
        }
    },
    table_fileds: [
        table_fields_schema
    ],
    charts_details: [
        chart_fields_schema
    ]
}, { timestamps: true });

const appMetaModel = mongoose.model("app_meta_objects", appMetaSchema);

module.exports = appMetaModel;