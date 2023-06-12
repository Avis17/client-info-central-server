
const { Mongoose, default: mongoose } = require("mongoose")

// var DBURL = process.env.DB_URL_LOCAL || 'mongodb://127.0.0.1:27017/cic';
const DBURL = process.env.DB_URL_PROD || "mongodb+srv://pvadivelsiva:client-info-central2023@cluster0.ucunosj.mongodb.net/cic?retryWrites=true&w=majority";

const connect = () => {
    return new Promise((resolve, reject) => {
        try {
            mongoose.connect(DBURL, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }).then((response) => {
                return resolve("db connected successfully ")
            }).catch((err) => {
                return reject("db connection error")
            })
        } catch {
            return reject("db connection error")
        }
    })
}

module.exports = {
    connect
}