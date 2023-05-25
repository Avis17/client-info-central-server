const express = require("express")
const app = express()
const bodyParser = require("body-parser");
const cors = require("cors")
const authenticationRoute = require("./routes/authentication");
const authMiddleware = require("./middlewares/authMiddleware");
const PORT = process.env.PORT || 2000;
const mongo = require("./utils/dao");
var path = require('path');

// middlewares
app.use(cors())
app.use(bodyParser({extended:true}))
app.use(authenticationRoute)
app.use(authMiddleware);
app.use(express.static(path.join(__dirname, 'public'))); 

app.get("/", (req, res)=>{

})

mongo.connect().then((result)=>{
    console.log(result)
}).catch((err)=>{
    console.log(err)
})

app.listen(PORT, ()=>{
    console.log("CLC server is running on PORT "+PORT)
})