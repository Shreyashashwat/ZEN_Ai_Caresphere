import mongoose from "mongoose";

const InsightSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  }
}, { _id: false }); // Subdocuments typically don't need their own _id

const WeeklyInsightSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  week: {
    type: String, // Format: "2024-W05" or similar
    required: true
  },
  insights: [InsightSchema],
  created_at: {
    type: Date,
    default: Date.now
  }
});

// ✅ CORRECT - Index on WeeklyInsightSchema
WeeklyInsightSchema.index(
  { user_id: 1, week: 1 },
  { unique: true }
);

// Add index for querying by user
WeeklyInsightSchema.index({ user_id: 1, created_at: -1 });

export const WeeklyInsight = mongoose.model("WeeklyInsight", WeeklyInsightSchema);
export default WeeklyInsight;