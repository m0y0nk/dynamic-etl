import express from "express" 
import configDB from "./src/db/dbConfig.js" 
import dotenv from "dotenv" 

const app= express() 

app.use(express.json() ) 
dotenv.config() 

configDB() 

app.post("/upload", async (req, res )=> 
{ 

})

app.listen(8080, ()=> 
{ 
    console.log("Server Is Listening On PORT 8080 " ) 
} ) 