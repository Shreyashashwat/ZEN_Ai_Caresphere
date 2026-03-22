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
}, { _id: false });

const WeeklyInsightSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  week: {
    type: String, // Format: "2026-W06"
    required: true
  },
  insights: [InsightSchema],
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Unique constraint: one insight per user per week
WeeklyInsightSchema.index(
  { user_id: 1, week: 1 },
  { unique: true }
);

// Index for querying user's insights
WeeklyInsightSchema.index({ user_id: 1, created_at: -1 });

export const WeeklyInsight = mongoose.model("WeeklyInsight", WeeklyInsightSchema);
export default WeeklyInsight;