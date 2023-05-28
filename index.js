const express = require("express")
const app = express()
const bodyParser = require("body-parser");
const cors = require("cors")
const authenticationRoute = require("./routes/authentication");
const appMetaCreaton = require("./routes/app-meta-creation");
const authMiddleware = require("./middlewares/authMiddleware");
const PORT = process.env.PORT || 2000;
const mongo = require("./utils/dao");
var path = require('path');

// middlewares
app.use(cors())
app.use(bodyParser({extended:true}))
app.use(express.static(path.join(__dirname, 'public'))); 
app.use(authenticationRoute)

app.get("/", (req, res)=>{
    res.sendFile(path.join(public, 'index.html'));
})
app.use(authMiddleware);
app.use("/app-meta-creation", appMetaCreaton)

mongo.connect().then((result)=>{
    console.log(result)
}).catch((err)=>{
    console.log(err)
})

app.listen(PORT, ()=>{
    console.log("CLC server is running on PORT "+PORT)
})