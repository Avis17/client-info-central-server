
const {Mongoose, default: mongoose} = require("mongoose")
// const URL = "mongodb+srv://pvadivelsiva:wKqEdzQ9bNUK0AiM@cluster0.ucunosj.mongodb.net/?retryWrites=true&w=majority"

var DBURL = "mongodb+srv://pvadivelsiva:client-info-central2023@cluster0.ucunosj.mongodb.net/cic?retryWrites=true&w=majority"

// const DBURL = "mongodb://127.0.0.1:27017/cic"
const connect = ()=>{
    return new Promise((resolve, reject)=>{
        try{
            mongoose.connect(DBURL, {
                useNewUrlParser: true,
                useUnifiedTopology: true
              }).then((response)=>{
                return resolve("db connected successfully")
            }).catch((err)=>{
                return reject("db connection error")
            })
        }catch {
            return reject("db connection error")
        }
    })
}

module.exports = {
    connect
}