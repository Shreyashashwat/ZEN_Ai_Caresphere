from langchain_core.tools import tool
from agent.utils.api_client import api_get, api_post
from datetime import datetime, timezone


def make_appointment_tools(token: str):

    @tool
    def get_available_doctors(dummy_input: str = "") -> str:
        """
        Get the list of all available doctors the user can book an appointment with.
        Always call this FIRST before book_appointment so you know which doctors exist
        and can show their names and IDs to help the user pick one.
        No input needed — pass an empty string.
        """
        try:
            result = api_get("/api/v1/doctors", token)
            doctors = result.get("data", [])

            if not doctors:
                return "No doctors are currently available in the system."

            lines = []
            for i, d in enumerate(doctors, 1):
                spec = d.get("specialization") or "General Physician"
                exp = d.get("experience")
                exp_text = f" | {exp} yrs experience" if exp else ""
                lines.append(
                    f"{i}. Dr. {d.get('username', '').title()} — {spec}{exp_text} | ID: {d.get('_id')}"
                )
            return "DOCTORS_LIST:\n" + "\n".join(lines)

        except Exception as e:
            return f"Error fetching doctors: {str(e)}"
       