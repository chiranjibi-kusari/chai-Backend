// require('dotenv').config({path:'./env'})
import dotenv from 'dotenv'
import connectDb from "./db/indexs.js";

dotenv.config({
  path:"./env"
})

connectDb().then(()=>{
  app.listen(process.env.PORT || 8000,()=>{
    console.log(`server is running at port: ${process.env.PORT}`);
    
  })
}).catch((err)=>{
  console.log('mondo db connection failed',err);
  
})
