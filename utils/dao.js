
const {Mongoose, default: mongoose} = require("mongoose")
// const URL = "mongodb+srv://pvadivelsiva:wKqEdzQ9bNUK0AiM@cluster0.ucunosj.mongodb.net/?retryWrites=true&w=majority"

// const dbUrl = `mongodb+srv://username:password@clustername.mongodb.net/${dbName}?retryWrites=true&w=majority`;

const URL = "mongodb://127.0.0.1:27017/cic"
const connect = ()=>{
    return new Promise((resolve, reject)=>{
        try{
            mongoose.connect(URL, {
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