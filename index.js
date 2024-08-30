const mongoose= require("mongoose");
mongoose.connect("mongodb://localhost:27017/user-authentication-system");

const express= require("express");
const helmet=require("helmet");
const app = express();
app.use(express.json());
app.use(helmet());

const authRouter=require('./routers/authRouter')
app.use('/user',authRouter)
const port=6000;


app.listen(port,()=>{
    console.log(`Server is running on port: ${port}`);
});
