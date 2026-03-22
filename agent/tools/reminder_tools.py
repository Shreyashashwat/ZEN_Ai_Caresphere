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
