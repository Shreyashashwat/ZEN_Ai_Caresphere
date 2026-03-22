import React, { useMemo } from "react";
import { Clock, Pill, TrendingUp, Target, Leaf, Lightbulb, Activity, BarChart2, Flame, AlarmClock, AlertCircle } from "lucide-react";


const PRIORITY = {
  high:   { order: 0, borderColor: "#f87171", dot: "#f87171", tagBg: "#fef2f2", tagText: "#dc2626", label: "Urgent"  },
  medium: { order: 1, borderColor: "#fbbf24", dot: "#fbbf24", tagBg: "#fffbeb", tagText: "#d97706", label: "Improve" },
  low:    { order: 2, borderColor: "#34d399", dot: "#34d399", tagBg: "#f0fdf4", tagText: "#16a34a", label: "Good"    },
};


const CATEGORY = {
  timing:      { icon: Clock,       iconColor: "#6366f1", action: "Set Reminder",  nav: "home"    },
  medicine:    { icon: Pill,        iconColor: "#f43f5e", action: "View Medicine", nav: "home"    },
  progress:    { icon: TrendingUp,  iconColor: "#10b981", action: "View Stats",    nav: "stats"   },
  consistency: { icon: Target,      iconColor: "#f59e0b", action: "View History",  nav: "history" },
  lifestyle:   { icon: Leaf,        iconColor: "#14b8a6", action: "View History",  nav: "history" },
  default:     { icon: Lightbulb,   iconColor: "#8b5cf6", action: null,            nav: null      },
};
const getCat = (c = "") => CATEGORY[c.toLowerCase()] || CATEGORY.default;

const ringColor = (pct) =>
  pct >= 80 ? { stroke: "#10b981", bg: "#d1fae5", text: "#059669" }
  : pct >= 50 ? { stroke: "#f59e0b", bg: "#fef3c7", text: "#d97706" }
  : pct >  0  ? { stroke: "#ef4444", bg: "#fee2e2", text: "#dc2626" }
  :             { stroke: "#e5e7eb", bg: "#f9fafb", text: "#9ca3af" };

const SummaryBanner = ({ adherenceRate, weeklyTrendLabel, streak, mostMissedTime }) => {
  if (adherenceRate == null) return null;

  const improving = weeklyTrendLabel === "improving";
  const worsening = weeklyTrendLabel === "worsening";
  const emoji     = improving ? "📈" : worsening ? "📉" : "➡️";
  const heading   = improving
    ? `You're improving — ${adherenceRate}% adherence this week`
    : worsening
    ? `Needs attention — adherence dropped to ${adherenceRate}%`
    : `Holding steady at ${adherenceRate}% adherence`;
  const sub = mostMissedTime && mostMissedTime !== "none"
    ? `Most doses missed in the ${mostMissedTime}. Focus there first.`
    : "Keep your current routine going.";

  // Adherence ring inside banner
  const SIZE   = 72;
  const STROKE = 6;
  const R      = (SIZE - STROKE) / 2;
  const CIRC   = 2 * Math.PI * R;
  const rc     = ringColor(adherenceRate);
  const offset = CIRC - (adherenceRate / 100) * CIRC;

  return (
    <div
      style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)" }}
      className="rounded-2xl px-6 py-6 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
    >
      {/* Left: text */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mb-2">
          Weekly Summary
        </p>
        <p className="text-lg sm:text-xl font-bold leading-snug text-white">
          {emoji} {heading}
        </p>
        <p className="text-sm text-white/50 mt-1.5">{sub}</p>
      </div>

      {/* Right: adherence ring + streak badge */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Adherence ring */}
        <div className="relative flex-shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} style={{ transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 }}>
            <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={STROKE} />
            <circle
              cx={SIZE/2} cy={SIZE/2} r={R}
              fill="none"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={STROKE}
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-base font-black text-white">{adherenceRate}%</span>
          </div>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
            className="flex flex-col items-center justify-center px-4 py-3 rounded-xl min-w-[64px]"
          >
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-0.5">Streak</p>
            <p className="text-lg font-black text-white leading-none">🔥 {streak}d</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MetaStats = ({ meta }) => {
  if (!meta || meta.adherenceRate == null) return null;

  const trend = meta.weeklyTrendLabel || "stable";
  const trendColor =
    trend === "improving" ? "#16a34a" :
    trend === "worsening" ? "#dc2626" : "#4f46e5";

 const items = [
    { label: "ADHERENCE",   value: `${meta.adherenceRate}%`,  sub: "this week",    Icon: Activity,     iconColor: "#6366f1" },
    { label: "TREND",       value: trend.charAt(0).toUpperCase() + trend.slice(1), sub: "vs last week", Icon: BarChart2,    iconColor: trendColor, valueColor: trendColor },
    { label: "STREAK",      value: `${meta.streak ?? 0}d`,    sub: "consecutive",  Icon: Flame,        iconColor: "#f97316" },
    { label: "MISSED MOST", value: meta.mostMissedTime ?? "—",sub: "time of day",  Icon: AlarmClock,   iconColor: "#8b5cf6" },
    { label: "NEEDS WORK",  value: meta.worstMedicine ?? "None", sub: "medicine",  Icon: AlertCircle,  iconColor: "#f43f5e" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((s, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 px-4 py-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-1.5 mb-2.5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: s.iconColor + "18" }}>
              <s.Icon size={13} style={{ color: s.iconColor }} strokeWidth={2.5} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400">{s.label}</span>
          </div>
          <p className="text-xl font-black truncate leading-none" style={{ color: s.valueColor || "#1f2937" }}>
            {s.value}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">{s.sub}</p>
        </div>
      ))}
    </div>
  );
};

const TrendChart = ({ weeklyTrend }) => {
  if (!weeklyTrend?.length) return null;

  const filled = weeklyTrend.filter((w) => w.total > 0);
  const avg    = filled.length
    ? Math.round(filled.reduce((s, w) => s + w.pct, 0) / filled.length)
    : 0;

  const SIZE   = 100;
  const STROKE = 9;
  const R      = (SIZE - STROKE) / 2;
  const CIRC   = 2 * Math.PI * R;

  // Average ring uses indigo/purple like the screenshot
  const avgColor = { stroke: "#6366f1", bg: "#eef2ff", text: "#4f46e5" };

  const RingCircle = ({ pct, taken, total, label, isAvg = false, isLatest = false }) => {
    const c      = isAvg ? avgColor : ringColor(pct);
    const offset = CIRC - (pct / 100) * CIRC;

    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative" style={{ width: SIZE, height: SIZE, background: c.bg, borderRadius: "50%" }}>
          <svg
            width={SIZE} height={SIZE}
            style={{ transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 }}
          >
            {/* track */}
            <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="#e5e7eb" strokeWidth={STROKE} />
            {/* progress */}
            {pct > 0 && (
              <circle
                cx={SIZE/2} cy={SIZE/2} r={R}
                fill="none"
                stroke={c.stroke}
                strokeWidth={STROKE}
                strokeDasharray={CIRC}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.9s ease" }}
              />
            )}
          </svg>
          {/* Centre text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black leading-none" style={{ color: c.text }}>{pct}%</span>
            {total > 0 && (
              <span className="text-[9px] font-semibold text-gray-400 mt-0.5">{taken}/{total}</span>
            )}
          </div>
        </div>
        {/* Label */}
        <div className="text-center">
          <p className={`text-[11px] font-bold ${isAvg ? "text-indigo-600" : isLatest ? "text-gray-700" : "text-gray-400"}`}>
            {label}
          </p>
          {isAvg && <p className="text-[9px] text-gray-400">all weeks</p>}
          {!isAvg && total > 0 && (
            <p className="text-[9px] text-gray-400">{taken}/{total} doses</p>
          )}
          {!isAvg && total === 0 && (
            <p className="text-[9px] text-gray-300">no data</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-gray-700">Weekly Adherence</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Average: <strong className="text-gray-700">{avg}%</strong>
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400 font-semibold">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />≥ 80%</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />50–79%</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />&lt; 50%</span>
        </div>
      </div>

      {/* Rings row */}
      <div className="flex items-end justify-around gap-2 flex-wrap">
        {weeklyTrend.map((w, i) => (
          <RingCircle
            key={i}
            pct={w.pct}
            taken={w.taken}
            total={w.total}
            label={`Week ${i + 1}`}
            isLatest={i === weeklyTrend.length - 1}
          />
        ))}
        {/* Average circle — styled in indigo like screenshot */}
        <RingCircle
          pct={avg}
          taken={filled.reduce((s, w) => s + w.taken, 0)}
          total={filled.reduce((s, w) => s + w.total, 0)}
          label="Average"
          isAvg
        />
      </div>

      {/* Trend footer */}
      {filled.length >= 2 && (() => {
        const last = filled[filled.length - 1].pct;
        const prev = filled[filled.length - 2].pct;
        const diff = last - prev;
        const up   = diff >= 0;
        return (
          <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-center gap-2">
            <span className={`text-xs font-bold ${up ? "text-emerald-600" : "text-red-500"}`}>
              {up ? "▲" : "▼"} {Math.abs(diff)}% vs last week
            </span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">{avg}% monthly average</span>
          </div>
        );
      })()}
    </div>
  );
};

const InsightCard = ({ insight, onNavigate }) => {
  const p   = PRIORITY[insight.priority?.toLowerCase()] || PRIORITY.medium;
  const cat = getCat(insight.category);

  const title      = insight.title      || insight.category || "Insight";
  const metric     = insight.metric     || "";
  const suggestion = insight.suggestion || insight.text     || "";

  return (
    <div
      style={{ borderLeftColor: p.borderColor }}
      className="bg-white rounded-2xl border border-gray-100 border-l-[3px] shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col"
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: cat.iconColor + "18" }}
            >
              <cat.icon size={16} style={{ color: cat.iconColor }} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-800 leading-snug">{title}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "#9ca3af" }}>
                {insight.category}
              </p>
            </div>
          </div>
          <span
            className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: p.tagBg, color: p.tagText }}
          >
            {p.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pb-3 flex-1 space-y-2.5">
        {metric && (
          <div className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.dot }} />
            <p className="text-sm text-gray-700 font-semibold leading-snug">{metric}</p>
          </div>
        )}
        {suggestion && (
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-start gap-2">
            <span className="text-sm flex-shrink-0 mt-0.5">💡</span>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">{suggestion}</p>
          </div>
        )}
      </div>

      {/* Action */}
      {cat.nav && (
        <div className="px-5 pb-4 pt-1">
          <button
            onClick={() => onNavigate?.(cat.nav)}
            className="w-full py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-200"
          >
            {cat.action} →
          </button>
        </div>
      )}
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border-l-[3px] border-gray-200 shadow-sm p-5 animate-pulse">
    <div className="flex gap-2.5 mb-4">
      <div className="w-7 h-7 bg-gray-100 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-36 bg-gray-100 rounded" />
        <div className="h-2.5 w-16 bg-gray-100 rounded" />
      </div>
      <div className="h-5 w-14 bg-gray-100 rounded-full" />
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-3 w-full bg-gray-100 rounded" />
      <div className="h-3 w-4/5 bg-gray-100 rounded" />
    </div>
    <div className="h-8 w-full bg-gray-50 rounded-xl border border-gray-100" />
  </div>
);


const EmptyState = ({ onGenerate, isGenerating }) => (
  <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
    <div className="w-14 h-14 bg-gray-50 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl border border-gray-100">
      🤖
    </div>
    <h3 className="text-sm font-bold text-gray-700 mb-1">No insights yet</h3>
    <p className="text-xs text-gray-400 max-w-xs mx-auto mb-5">
      Generate your first AI health report based on this week's medication data.
    </p>
    {/* <button
      onClick={onGenerate}
      disabled={isGenerating}
      className="px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold shadow-sm disabled:opacity-50 transition-all"
    >
      {isGenerating ? "Generating…" : "✨ Generate Insights"}
    </button> */}
  </div>
);

const InsightsTab = ({
  weeklyInsights,
  weeklyTrend,
  insightsMeta,
  generatingInsights,
  cooldownMins,
  handleGenerateInsights,
  setActiveTab,
}) => {
  const sorted = useMemo(() => {
    if (!weeklyInsights?.length) return [];
    return [...weeklyInsights].sort((a, b) => {
      const ao = PRIORITY[a.priority?.toLowerCase()]?.order ?? 3;
      const bo = PRIORITY[b.priority?.toLowerCase()]?.order ?? 3;
      return ao - bo;
    });
  }, [weeklyInsights]);

  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-5 py-7 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white text-base">✦</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">Health Coach</h2>
            <p className="text-xs text-gray-400">Personalised insights from your medication data</p>
          </div>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-1">
          <button
            onClick={handleGenerateInsights}
            disabled={generatingInsights}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {generatingInsights ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating…
              </>
            ) : (
              <><span>✨</span> Generate Insights</>
            )}
          </button>
          {cooldownMins && (
            <p className="text-xs text-gray-400">Next refresh in {cooldownMins} min</p>
          )}
        </div>
      </div>

      {/* Summary banner */}
      <SummaryBanner
        adherenceRate={insightsMeta?.adherenceRate}
        weeklyTrendLabel={insightsMeta?.weeklyTrendLabel}
        streak={insightsMeta?.streak}
        mostMissedTime={insightsMeta?.mostMissedTime}
      />

      {/* Meta stats */}
      <MetaStats meta={insightsMeta} />

      {/* Weekly adherence rings */}
      <TrendChart weeklyTrend={weeklyTrend} />

      {/* Skeletons */}
      {generatingInsights && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!generatingInsights && sorted.length === 0 && (
        <EmptyState onGenerate={handleGenerateInsights} isGenerating={generatingInsights} />
      )}

      {/* Insight cards grouped by priority */}
      {!generatingInsights && sorted.length > 0 && (
        <div className="space-y-7">
          {["high", "medium", "low"].map((priority) => {
            const group = sorted.filter(
              (ins) => (ins.priority?.toLowerCase() || "medium") === priority
            );
            if (!group.length) return null;
            const p = PRIORITY[priority];
            const sectionLabel =
              priority === "high"   ? "Needs Attention" :
              priority === "medium" ? "Worth Improving"  : "Going Well";

            return (
              <div key={priority}>
                {/* Section header */}
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.dot }} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                    {sectionLabel}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs font-bold text-gray-400">{group.length}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.map((ins, idx) => (
                    <InsightCard
                      key={idx}
                      insight={ins}
                      onNavigate={(tab) => setActiveTab?.(tab)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </section>
  );
};

export default InsightsTab;