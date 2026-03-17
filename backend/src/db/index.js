import mongoose from "mongoose";

import { db_name } from "../constants.js";


const connectDB=async ()=>{
    try {
        const connection= await mongoose.connect(`${process.env.MONGODB_URI}`)
        console.log(`MongDB connected !! ${connection.connection.host}` )
    
    } catch (error) {
        console.log("ERROR:",error)
        process.exit(1)
        
    }
}
export default connectDB