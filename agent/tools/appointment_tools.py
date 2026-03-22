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

    @tool
    def get_upcoming_appointment(dummy_input: str = "") -> str:
        """
        Get the user's next upcoming appointment.
        Call this when the user asks when their next appointment is
        or whether they have any upcoming appointments.
        No input needed — pass an empty string.
        """
        try:
            # Uses patient-facing endpoint
            result = api_get("/api/v1/doctor-request/myappointments", token)
            appointments = result.get("data", [])

            now = datetime.now(timezone.utc)
            upcoming = [
                a for a in appointments
                if a.get("appointmentDate") and
                datetime.fromisoformat(
                    a["appointmentDate"].replace("Z", "+00:00")
                ) > now
                and a.get("status") not in ("CANCELLED", "COMPLETED")
            ]

            if not upcoming:
                return "You have no upcoming appointments scheduled."

            apt = upcoming[0]
            doctor = apt.get("doctorId", {})
            doc_name = doctor.get("username", "your doctor") if isinstance(doctor, dict) else "your doctor"

            # Format date nicely
            date_str = apt.get("appointmentDate", "")
            try:
                dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                date_str = dt.strftime("%B %d, %Y at %I:%M %p")
            except Exception:
                pass

            return (
                f"Your next appointment:\n"
                f"  📅 Date: {date_str}\n"
                f"  👨‍⚕️ Doctor: Dr. {doc_name.title()}\n"
                f"  📋 Reason: {apt.get('problem', 'Not specified')}\n"
                f"  Status: {apt.get('status', 'PENDING')}"
            )

        except Exception as e:
            return f"Error fetching upcoming appointment: {str(e)}"

    @tool
    def book_appointment(doctorId: str, appointmentDate: str, problem: str) -> str:
        """
        Book an appointment with a doctor on behalf of the user.
        IMPORTANT: You MUST call get_available_doctors first and copy the EXACT ID
        from the DOCTORS_LIST output (e.g. '69876638c9c7ca4d1eb19be2').
        NEVER invent, guess, or use placeholder values like 'doctorId' or 'doctorId_placeholder'.
        NEVER assume a time. If the user did not provide a time, ask them for it before calling this tool.
        Args:
            doctorId: the doctor's EXACT 24-char hex MongoDB ID from get_available_doctors output
            appointmentDate: ISO datetime string e.g. "2026-03-20T10:00:00"
            problem: reason for visit e.g. "chest pain", "routine checkup"
        Only call this after get_available_doctors and after the user confirms details.
        """
        if not doctorId or not appointmentDate or not problem:
            return "Missing required fields: doctorId, appointmentDate, and problem are all required."

        # Guard: reject placeholder/fake IDs - must be a 24-char hex MongoDB ObjectId
        import re
        if not re.fullmatch(r'[a-fA-F0-9]{24}', doctorId):
            return (
                "⚠️ Invalid doctorId provided. You must use the exact doctor ID returned by "
                "get_available_doctors (a 24-character hex string like '69876638c9c7ca4d1eb19be2'). "
                "Please call get_available_doctors first to get the real ID."
            )

        try:
            appt_dt = datetime.fromisoformat(appointmentDate)
            if appt_dt < datetime.now():
                return "⚠️ The appointment date you provided is in the past. Please provide a future date."
        except ValueError:
            return "⚠️ Invalid date format. Please use a format like '2026-03-20T10:00:00'."

        try:
            result = api_post(
                "/api/v1/doctor-request/createAppointment",
                token,
                {
                    "doctorId":        doctorId,
                    "appointmentDate": appointmentDate,
                    "problem":         problem,
                }
            )
            appt = result.get("data", {})
            doctor_field = appt.get("doctorId", {})
            confirmed_name = (
                doctor_field.get("username") if isinstance(doctor_field, dict) else None
            ) or "your doctor"

            # Format date nicely
            date_str = appt.get("appointmentDate", appointmentDate)
            try:
                dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                date_str = dt.strftime("%B %d, %Y at %I:%M %p")
            except Exception:
                pass

            return (
                f"✅ Appointment booked successfully!\n"
                f"  👨‍⚕️ Doctor: Dr. {confirmed_name.title()}\n"
                f"  📅 Date: {date_str}\n"
                f"  📋 Reason: {appt.get('problem', problem)}\n"
                f"  Status: PENDING — waiting for doctor confirmation."
            )
        except Exception as e:
            return f"Error booking appointment: {str(e)}"

    return [get_available_doctors, get_all_appointments, get_upcoming_appointment, book_appointment]