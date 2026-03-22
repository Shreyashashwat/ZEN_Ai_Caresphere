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

    @tool
    def get_all_appointments(dummy_input: str = "") -> str:
        """
        Get all of the user's appointments — past and upcoming.
        Call this when the user asks to see all their appointments
        or their appointment history.
        No input needed — pass an empty string.
        """
        try:
            # Uses patient-facing endpoint
            result = api_get("/api/v1/doctor-request/myappointments", token)
            appointments = result.get("data", [])

            if not appointments:
                return "You have no appointments on record."

            lines = []
            for a in appointments:
                doctor = a.get("doctorId", {})
                doc_name = doctor.get("username", "Unknown doctor") if isinstance(doctor, dict) else "Unknown doctor"
                date_str = a.get("appointmentDate", "Unknown date")
                # Format date nicely if possible
                try:
                    dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    date_str = dt.strftime("%B %d, %Y at %I:%M %p")
                except Exception:
                    pass
                lines.append(
                    f"- {date_str} | Dr. {doc_name.title()} | "
                    f"Reason: {a.get('problem', 'Not specified')} | "
                    f"Status: {a.get('status', 'Unknown')}"
                )
            return "Your appointments:\n" + "\n".join(lines)

        except Exception as e:
            return f"Error fetching appointments: {str(e)}"

