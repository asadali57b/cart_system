const mongoose= require("mongoose");
mongoose.connect("mongodb+srv://asadali57b:asad2614432@cluster0.hdlpy.mongodb.net/testdb?retryWrites=true&w=majority&appName=Cluster0");

const express= require("express");
const helmet=require("helmet");
const app = express();
app.use(express.json());
app.use(helmet());

const authRouter=require('./routers/authRouter')
app.use('/api/user',authRouter)
const port=6000;


app.listen(port,()=>{
    console.log(`Server is running on port: ${port}`);
});
