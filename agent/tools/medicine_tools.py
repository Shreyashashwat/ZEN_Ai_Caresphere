import json
from langchain_core.tools import tool
from agent.utils.api_client import api_get, api_post, api_put, api_delete


def make_medicine_tools(token: str):
    """
    Factory function — call this with the user's JWT token.
    Returns a list of LangChain tools with the token baked in via closure.
    The LLM never sees or handles the token directly.
    """

    @tool
    def get_all_medicines(dummy_input: str = "") -> str:
        """
        Get all medicines the user is currently tracking.
        Call this when the user asks what medicines they are on,
        wants to see their medicine list, or before updating/deleting a medicine.
        No input needed — pass an empty string.
        """
        try:
            result = api_get("/api/v1/medicine", token)
            medicines = result.get("data", [])

            if not medicines:
                return "You have no medicines currently being tracked."

            lines = []
            for m in medicines:
                times = ", ".join(m.get("time", []))
                lines.append(
                    f"- {m['medicineName']} | Dosage: {m['dosage']} | "
                    f"Frequency: {m['frequency']} | Times: {times} | "
                    f"Taken: {m.get('takenCount', 0)} | Missed: {m.get('missedCount', 0)}"
                )
            return "Your current medicines:\n" + "\n".join(lines)

        except Exception as e:
            return f"Error fetching medicines: {str(e)}"

    @tool
    def add_medicine(medicineName: str, dosage: str, frequency: str, time: str, startDate: str, endDate: str = "") -> str:
        """
        Add a new medicine to the user's tracking list.
        Args:
            medicineName: name of the medicine e.g. "Metformin"
            dosage: e.g. "500mg"
            frequency: one of "daily", "weekly", "custom"
            time: comma-separated times in HH:MM format e.g. "08:00" or "08:00,20:00"
            startDate: ISO date string e.g. "2025-01-15"
            endDate: optional ISO date string, leave empty if not needed
        """
        time_list = [t.strip() for t in time.split(",")]
        body = {
            "medicineName": medicineName,
            "dosage":       dosage,
            "frequency":    frequency,
            "time":         time_list,
            "startDate":    startDate,
        }
        if endDate:
            body["endDate"] = endDate

        try:
            result = api_post("/api/v1/medicine", token, body)
            med = result.get("data", {})
            return (
                f"Successfully added {med.get('medicineName', medicineName)} "
                f"({med.get('dosage', dosage)}) to your tracking list. "
                f"Scheduled for: {', '.join(med.get('time', time_list))}."
            )
        except Exception as e:
            return f"Error adding medicine: {str(e)}"

    @tool
    def update_medicine(name: str, dosage: str = "", time: str = "", frequency: str = "", endDate: str = "") -> str:
        """
        Update an existing medicine's details such as dosage, timing, or frequency.
        Args:
            name: the current medicine name to identify it e.g. "Metformin"
            dosage: new dosage e.g. "1000mg" — leave empty to keep unchanged
            time: new comma-separated times e.g. "09:00,21:00" — leave empty to keep unchanged
            frequency: new frequency e.g. "weekly" — leave empty to keep unchanged
            endDate: new end date e.g. "2026-12-31" — leave empty to keep unchanged
        """
        if not name:
            return "Please provide the name of the medicine to update."

        updates = {}
        if dosage:    updates["dosage"]    = dosage
        if time:      updates["time"]      = [t.strip() for t in time.split(",")]
        if frequency: updates["frequency"] = frequency
        if endDate:   updates["endDate"]   = endDate

        if not updates:
            return "Please specify at least one field to update (dosage, time, frequency, or endDate)."

        try:
            all_meds = api_get("/api/v1/medicine", token).get("data", [])
            match = next(
                (m for m in all_meds if m["medicineName"].lower() == name.lower()), None
            )
            if not match:
                return f"Could not find a medicine named '{name}'. Use get_all_medicines to see your list."

            api_put(f"/api/v1/medicine/{match['_id']}", token, updates)
            return f"Successfully updated {name}."
        except Exception as e:
            return f"Error updating medicine: {str(e)}"

    @tool
    def delete_medicine(medicine_name: str) -> str:
        """
        Delete a medicine from the user's tracking list permanently.
        Input: the exact medicine name as a plain string e.g. "Aspirin"
        IMPORTANT: Only call this after the user has explicitly confirmed they want to delete.
        This also deletes all associated reminders.
        """
        try:
            all_meds = api_get("/api/v1/medicine", token).get("data", [])
            match = next(
                (m for m in all_meds if m["medicineName"].lower() == medicine_name.lower()),
                None,
            )
            if not match:
                return f"Could not find a medicine named '{medicine_name}'. Use get_all_medicines to see your list."

            api_delete(f"/api/v1/medicine/{match['_id']}", token)
            return f"Successfully deleted {match['medicineName']} and all its reminders from your list."

        except Exception as e:
            return f"Error deleting medicine: {str(e)}"

    return [get_all_medicines, add_medicine, update_medicine, delete_medicine]