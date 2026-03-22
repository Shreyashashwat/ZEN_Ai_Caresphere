from langchain_core.tools import tool
from agent.utils.api_client import api_get


def make_analytics_tools(token: str, user_id: str):

    @tool
    def get_dashboard_stats(dummy_input: str = "") -> str:
        """
        Get the user's all-time overall medication adherence statistics.
        Call this for general health overview questions like:
        - "How am I doing overall?"
        - "What's my overall adherence?"
        - "Show me my health summary"
        No input needed — pass an empty string.
        """
        try:
            result = api_get("/api/v1/users/dashboard", token)
            data = result.get("data", {})

            taken = data.get("taken", 0)
            missed = data.get("missed", 0)
            total = taken + missed
            pct = round((taken / total) * 100) if total > 0 else 0

            performance = (
                "Outstanding! 🌟" if pct >= 90
                else "Good progress! 👍" if pct >= 70
                else "There's room to improve — the app can help! 💪" if pct >= 50
                else "Let's work on building better habits together. 🤝"
            )

            return (
                f"Your overall medication stats:\n"
                f"  ✅ Total doses taken: {taken}\n"
                f"  ❌ Total doses missed: {missed}\n"
                f"  📊 Overall adherence: {pct}%\n"
                f"  {performance}"
            )
        except Exception as e:
            return f"Error fetching dashboard stats: {str(e)}"

    @tool
    def get_weekly_insights(dummy_input: str = "") -> str:
        """
        Get AI-generated weekly health insights based on the user's data.
        Call this when the user asks for:
        - "Health insights"
        - "Weekly report"
        - "AI analysis of my health"
        - "Tips to improve"
        No input needed — pass an empty string.
        """
        try:
            result = api_get(f"/api/v1/users/insights/{user_id}", token)
            insights = result.get("insights", [])

            if not insights:
                return (
                    "No weekly insights are available yet. "
                    "They are automatically generated each week once you have enough tracking data."
                )

            lines = []
            for i in insights:
                priority_icon = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(
                    i.get("priority", "medium"), "🟡"
                )
                lines.append(
                    f"{priority_icon} [{i.get('category', 'General')}] {i.get('text', '')}"
                )

            return "Your weekly health insights:\n" + "\n".join(lines)

        except Exception as e:
            return f"Error fetching insights: {str(e)}"

    @tool
    def get_medicine_adherence(medicine_name: str) -> str:
        """
        Get detailed adherence statistics for one specific medicine.
        Call this when the user asks how well they are doing with a particular medicine.
        Input: the exact name of the medicine as a plain string (not JSON).
        Example input: "Metformin"
        """
        if not medicine_name or not medicine_name.strip():
            return "Please provide a medicine name."

        try:
            
            all_meds = api_get("/api/v1/medicine", token).get("data", [])
            match = next(
                (m for m in all_meds if m["medicineName"].lower() == medicine_name.strip().lower()),
                None,
            )
            if not match:
                return (
                    f"Could not find a medicine named '{medicine_name}'. "
                    "Use get_all_medicines to see your current list."
                )

            result = api_get(f"/api/v1/reminder/stats/medicine/{match['_id']}", token)
            data = result.get("data", {})

            taken = data.get("taken", 0)
            missed = data.get("missed", 0)
            pct = data.get("adherencePercent", 0)

            return (
                f"Adherence stats for {medicine_name}:\n"
                f"  ✅ Taken: {taken}\n"
                f"  ❌ Missed: {missed}\n"
                f"  📊 Adherence rate: {pct}%"
            )

        except Exception as e:
            return f"Error fetching medicine adherence: {str(e)}"

    return [get_dashboard_stats, get_weekly_insights, get_medicine_adherence]