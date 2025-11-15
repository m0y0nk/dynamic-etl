import express from "express"
import dotenv from "dotenv"
import multer from "multer";
import { handleUpload } from './uploadHandler.js';
import { connectToDb } from './src/db/mongoClient.js'; 

const app = express()
const upload = multer({ dest: 'uploads/' });

app.use(express.json())
dotenv.config()

app.post("/upload", upload.single('file'), handleUpload);

const port = 3000;

connectToDb() 
  /* .then(() => {
    app.listen(port, () => {
      console.log(`Server Is Listening On PORT ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  }); */ 
  app.listen(port, ()=> 
{ 
    console.log("Server Is Listening On PORT "+ port ) ; 
} ) 