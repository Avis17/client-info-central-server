
const {Mongoose, default: mongoose} = require("mongoose")
const URL = "mongodb+srv://pvadivelsiva:wKqEdzQ9bNUK0AiM@cluster0.ucunosj.mongodb.net/?retryWrites=true&w=majority"

const connect = ()=>{
    return new Promise((resolve, reject)=>{
        try{
            mongoose.connect(URL).then((response)=>{
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