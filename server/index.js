import express from "express" 
import configDB from "./src/db/dbConfig.js" 
import dotenv from "dotenv" 
import multer from "multer";
import { handleUpload } from './uploadHandler.js';

const app= express() 
const upload = multer({ dest: 'uploads/' });

app.use(express.json() ) 
dotenv.config() 

configDB() 

app.post("/upload", upload.single('file'), handleUpload);

app.listen(8080, ()=> 
{ 
    console.log("Server Is Listening On PORT 8080 " ) 
} ) 