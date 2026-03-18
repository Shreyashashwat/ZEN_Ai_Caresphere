import mongoose from "mongoose";




const connectDB=async ()=>{
    try {
        const connection= await mongoose.connect(`${process.env.MONGODB_URI}`)
        console.log(`MongDB connected !! ${connection.connection.host} MongoDB connected to: ${connection.connection.name}` )
    
    } catch (error) {
        console.log("ERROR:",error)
        process.exit(1)
        
    }
}
export default connectDB