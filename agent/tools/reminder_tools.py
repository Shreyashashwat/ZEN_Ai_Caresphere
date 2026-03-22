from langchain_core.tools import tool
from agent.utils.api_client import api_get, api_patch


def make_reminder_tools(token: str):

    @tool
    def get_reminders(dummy_input: str = "") -> str:
        """
        Get the user's upcoming and recent medication reminders.
        Call this when the user asks about their schedule, upcoming doses,
        what medicine to take next, or before marking a dose as taken/missed
        (so you can get the correct reminder ID).
        No input needed — pass an empty string.
        """
        try:
            result = api_get("/api/v1/reminder", token)
            reminders = result.get("data", [])

            if not reminders:
                return "You have no reminders scheduled."

            lines = []
            for r in reminders[:15]:  # cap at 15 to avoid huge context
                med = r.get("medicineId", {})
                med_name = med.get("medicineName", "Unknown") if isinstance(med, dict) else "Unknown"
                dosage = med.get("dosage", "") if isinstance(med, dict) else ""
                lines.append(
                    f"- [{r.get('status').upper()}] {med_name} {dosage} | "
                    f"Scheduled: {r.get('time')} | Reminder ID: {r.get('_id')}"
                )
            return "Your reminders:\n" + "\n".join(lines)

        except Exception as e:
            return f"Error fetching reminders: {str(e)}"

    @tool
    def mark_dose_taken(reminder_id: str) -> str:
        """
        Mark a specific dose as taken.
        Input: the Reminder's MongoDB ObjectId string (get this from get_reminders first).
        Only call this when the user explicitly confirms they took the medicine.
        This updates the taken count and syncs with Google Calendar if connected.
        """
        if not reminder_id or len(reminder_id) < 10:
            return "Invalid reminder ID. Please use get_reminders to find the correct ID."

        try:
            api_patch(f"/api/v1/reminder/taken/{reminder_id}", token)
            return (
                "Done! Marked as taken. Great job staying on track with your medication! 💊"
            )
        except Exception as e:
            return f"Error marking dose as taken: {str(e)}"

    @tool
    def mark_dose_missed(reminder_id: str) -> str:
        """
        Mark a specific dose as missed.
        Input: the Reminder's MongoDB ObjectId string (get this from get_reminders first).
        Only call this when the user confirms they missed a dose.
        The system will automatically reschedule the dose using AI logic.
        """
        if not reminder_id or len(reminder_id) < 10:
            return "Invalid reminder ID. Please use get_reminders to find the correct ID."

        try:
            api_patch(f"/api/v1/reminder/missed/{reminder_id}", token)
            return (
                "Noted — marked as missed. The system has automatically rescheduled this dose "
                "for you based on your usage patterns. Try not to miss the next one! 🔔"
            )
        except Exception as e:
            return f"Error marking dose as missed: {str(e)}"

    @tool
    def get_weekly_stats(dummy_input: str = "") -> str:
        """
        Get medication adherence statistics for the current week.
        Call this when the user asks:
        - "How many doses did I miss this week?"
        - "How am I doing this week?"
        - "What's my adherence this week?"
        - Any question about this week's performance.
        No input needed — pass an empty string.
        """
        try:
            result = api_get("/api/v1/reminder/stats/week", token)
            data = result.get("data", {})
            taken = data.get("taken", 0)
            missed = data.get("missed", 0)
            pending = data.get("pending", 0)
            pct = data.get("adherencePercent", 0)

            performance = (
                "Excellent! 🌟" if pct >= 90
                else "Good, keep it up! 👍" if pct >= 70
                else "Could be better — try setting reminders earlier. 📅"
            )

            return (
                f"This week's stats:\n"
                f"  ✅ Taken: {taken}\n"
                f"  ❌ Missed: {missed}\n"
                f"  ⏳ Pending: {pending}\n"
                f"  📊 Adherence: {pct}%\n"
                f"  {performance}"
            )
        except Exception as e:
            return f"Error fetching weekly stats: {str(e)}"

    return [get_reminders, mark_dose_taken, mark_dose_missed, get_weekly_stats]