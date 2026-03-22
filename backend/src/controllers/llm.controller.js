import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const callLLM = async (stats) => {
  const {
    adherencePercent,
    total,
    taken,
    missed,
    trend,
    worstMedicine,
    byMedicine,
    worstDay,
    mostMissedTimeSlot,
    byTime,
    currentStreak,
  } = stats;

  const medicineLines = (byMedicine || [])
    .map((m) => {
      const deltaStr =
        m.delta !== null && m.delta !== undefined
          ? ` [${m.delta >= 0 ? "+" : ""}${m.delta}% vs last week]`
          : "";
      return `  - ${m.name}: ${m.taken} taken, ${m.missed} missed (${m.adherence}% adherence${deltaStr})`;
    })
    .join("\n");

  const byTimeOfDay = byTime || {};
  const timeLines = Object.entries(byTimeOfDay)
    .map(([slot, v]) => `  - ${slot}: ${v.taken} taken, ${v.missed} missed`)
    .join("\n");

  const prompt = `
You are a compassionate but direct medication adherence coach AI. Give the patient specific, detailed, actionable insights based on their real data.

STRICT OUTPUT RULES:
- Respond ONLY with a valid JSON object — no markdown, no code fences, no extra text
- Generate between 5 and 6 insights total, spread across all three priority levels
- You MUST include at least 1 insight of each priority: "high", "medium", and "low"
- Maximum 2 insights per priority level
- Each insight must have EXACTLY these fields:

  "title"      → 4–6 words, name a specific medicine or time slot where possible
                 BAD: "Afternoon doses need attention"
                 GOOD: "Metformin missed every afternoon"

  "metric"     → 1–2 sentences with SPECIFIC numbers, percentages, medicine names, and comparisons
                 BAD: "You missed some doses"
                 GOOD: "You missed 9 of 14 afternoon doses this week (64% miss rate). Metformin accounts for 7 of those 9 misses."

  "suggestion" → 1–2 sentences, CONCRETE and actionable — name the medicine, the time, and a habit to pair it with
                 BAD: "Set a reminder"
                 GOOD: "Set a 2:00 PM alarm labelled 'Metformin with lunch' and keep the bottle on your dining table so it is visible at every meal."

  "category"   → EXACTLY one of: "Timing", "Consistency", "Progress", "Medicine", "Lifestyle"

  "priority"   → EXACTLY one of: "high", "medium", "low"
    "high"   = urgent problem: ≥50% of a medicine missed, adherence <60%, worsening trend, most missed time slot has majority misses
    "medium" = pattern to improve: specific weak day, time slot with some misses, one medicine below 80%
    "low"    = positive news ONLY: active streak, medicine at 80%+, week-over-week improvement, encouragement

PRIORITY RULES — CRITICAL:
- If the insight title or metric contains words like "missed", "struggling", "skipped", "dropped", "weakest", "low adherence" — priority MUST be "high" or "medium", NEVER "low"
- "low" is ONLY for genuinely good news — never assign "low" to any problem, even a small one
- Each insight must cover a DIFFERENT aspect — no two insights about the exact same issue
- Always use real numbers from the data — never invent statistics

PATIENT DATA THIS WEEK:
- Overall adherence: ${adherencePercent}% (${taken} taken out of ${total} total scheduled doses)
- Total missed doses: ${missed}
- Trend vs last week: ${trend}
- Current consecutive streak: ${currentStreak} doses taken without missing
- Most missed time of day: ${mostMissedTimeSlot}
- Worst day of week: ${worstDay || "none clearly identified"}
${
  worstMedicine
    ? `- Most problematic medicine: ${worstMedicine.name} (${worstMedicine.adherence}% adherence, missed ${worstMedicine.missed} times)`
    : "- No single medicine stands out as particularly problematic"
}

Per-medicine breakdown (this week vs last week):
${medicineLines || "  No per-medicine data available"}

Time-of-day breakdown:
${timeLines || "  No time-of-day data available"}

Generate 5 to 6 insights. At least 1 must be "high", at least 1 must be "medium", at least 1 must be "low". Max 2 per level.
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.35,
    max_tokens: 2000,
  });

  const text = response.choices[0].message.content;
  const cleaned = text.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("❌ Failed to parse Groq response:", cleaned);
    throw new Error("Groq returned invalid JSON");
  }

  const validCategories = ["Timing", "Consistency", "Progress", "Medicine", "Lifestyle"];
  const categoryFallbackMap = {
    "medication management": "Consistency",
    "medication reminders": "Timing",
    "adherence barriers": "Consistency",
    "medication review": "Medicine",
    "general": "Lifestyle",
  };

  const positiveKeywords = [
    "improved", "great", "keep up", "well done", "streak", "doing well",
    "momentum", "all doses", "100%", "best", "perfect", "solid",
    "nearly perfect", "rock solid", "positive trend", "paying off",
    "heading in the right", "strong adherence",
  ];

  const negativeKeywords = [
    "missed", "miss rate", "struggling", "struggle", "skipped",
    "dropped", "decline", "worst", "weakest", "problematic",
    "low adherence", "no doses", "0%", "behind",
    "needs attention", "needs focus", "needs adjustment",
  ];

  parsed.insights = parsed.insights.map((insight) => {
  
    if (!validCategories.includes(insight.category)) {
      insight.category =
        categoryFallbackMap[insight.category?.toLowerCase()] || "Lifestyle";
    }

    if (!["high", "medium", "low"].includes(insight.priority)) {
      insight.priority = "medium";
    }

    const allText = [
      insight.title,
      insight.metric,
      insight.suggestion,
      insight.text,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const isPositive = positiveKeywords.some((kw) => allText.includes(kw));
    const isNegative = negativeKeywords.some((kw) => allText.includes(kw));


    if (isPositive && !isNegative && insight.priority === "high") {
      insight.priority = "low";
    }

  
    if (isNegative && insight.priority === "low") {
      insight.priority = "medium";
    }

    const missMatch = insight.metric?.match(/(\d+)\s+of\s+(\d+)/i);
    if (missMatch) {
      const missCount  = parseInt(missMatch[1]);
      const totalCount = parseInt(missMatch[2]);
      if (totalCount > 0 && missCount / totalCount >= 0.5) {
        insight.priority = "high";
      }
    }


    const missRateMatch = insight.metric?.match(/(\d+)%\s*miss rate/i);
    if (missRateMatch && parseInt(missRateMatch[1]) >= 50) {
      insight.priority = "high";
    }

 
    if (!insight.text) {
      insight.text = [insight.title, insight.metric, insight.suggestion]
        .filter(Boolean)
        .join(". ");
    }

    return insight;
  });

 
  const capped = { high: [], medium: [], low: [] };
  for (const ins of parsed.insights) {
    const p = ins.priority;
    if (capped[p] && capped[p].length < 2) capped[p].push(ins);
  }

 
  if (capped.low.length === 0) {
    const trendLabel = trend === "improving" ? "improving" : "stable";
    capped.low.push({
      title: currentStreak > 0 ? `${currentStreak}-day streak active` : "Overall trend is " + trendLabel,
      metric: currentStreak > 0
        ? `You have taken doses consistently for ${currentStreak} consecutive days — a positive sign of building habit.`
        : `Your overall adherence is ${adherencePercent}% this week and the trend is ${trend} compared to last week.`,
      suggestion: currentStreak > 0
        ? `Keep the streak going. Aim for 7 consecutive days to turn this into a lasting routine.`
        : `Focus on fixing the afternoon slot first — that single change could push your adherence significantly higher next week.`,
      category: "Progress",
      priority: "low",
      text: "",
    });
  }

  parsed.insights = [...capped.high, ...capped.medium, ...capped.low];

  if (!parsed.insights || !Array.isArray(parsed.insights)) {
    throw new Error("Groq response missing insights array");
  }

  return parsed;
};