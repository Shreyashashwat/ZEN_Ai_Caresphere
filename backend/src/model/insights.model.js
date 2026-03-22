import mongoose from "mongoose";

const InsightSchema = new mongoose.Schema({
  title:      { type: String, default: "" },
  metric:     { type: String, default: "" },
  suggestion: { type: String, default: "" },
  text:       { type: String, default: "" },
  category:   { type: String, required: true },
  priority:   { type: String, enum: ["low", "medium", "high"], default: "medium" }
}, { _id: false });

const WeekTrendSchema = new mongoose.Schema({
  label: { type: String },
  taken: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  pct:   { type: Number, default: 0 },
}, { _id: false });

const MetaStatsSchema = new mongoose.Schema({
  adherenceRate:    { type: Number, default: 0 },
  weeklyTrendLabel: { type: String, default: "stable" },
  streak:           { type: Number, default: 0 },
  mostMissedTime:   { type: String, default: "none" },
  worstMedicine:    { type: String, default: null },
}, { _id: false });

const WeeklyInsightSchema = new mongoose.Schema({
  user_id:           { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  week:              { type: String, required: true },
  insights:          [InsightSchema],
  weeklyTrend:       [WeekTrendSchema],
  meta:              { type: MetaStatsSchema, default: () => ({}) },
  created_at:        { type: Date, default: Date.now },
  last_generated_at: { type: Date, default: null },
});

WeeklyInsightSchema.index({ user_id: 1, week: 1 }, { unique: true });
WeeklyInsightSchema.index({ user_id: 1, created_at: -1 });

export const WeeklyInsight = mongoose.model("WeeklyInsight", WeeklyInsightSchema);
export default WeeklyInsight;