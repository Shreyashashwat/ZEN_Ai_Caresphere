import   mongoose ,{Schema} from "mongoose"


const aiAnalyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  medicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Medication" },
  pattern: { type: String }, // e.g. "misses night dose"
  riskLevel: { type: Number, min: 0, max: 1 }, // prediction probability
  lastAnalysis: { type: Date, default: Date.now },
  suggestedAction: { type: String } // e.g. "Send extra reminder at 9:15 PM"
});
export const AIAnalytics = mongoose.model("AIAnalytics", aiAnalyticsSchema);