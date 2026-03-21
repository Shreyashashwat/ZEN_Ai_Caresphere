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