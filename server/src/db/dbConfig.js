import mongoose from "mongoose" 

async function configDB() 
{ 
    try 
    { 
        await mongoose.connect(process.env.DBURL ) 
        console.log("MongoDB Connected" ) 
    } catch (error ) 
    { 
        console.log("Internal Server Error "+ error ) 
    } 
} 

export default configDB ; 