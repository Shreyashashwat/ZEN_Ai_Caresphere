import   mongoose ,{Schema} from "mongoose"


const aiAnalyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
  pattern: { type: String }, 
  riskLevel: { type: Number, min: 0, max: 1 }, 
  lastAnalysis: { type: Date, default: Date.now },
  suggestedAction: { type: String } 
});
export const AIAnalytics = mongoose.model("AIAnalytics", aiAnalyticsSchema);
