import re

MAX_RESPONSE_LENGTH = 2500

# Patterns that should never appear in the output
LEAK_PATTERNS = [
    r"(password|passwd)\s*[:=]\s*\S+",                         # password: value
    r"\b(sk-|AIza)[A-Za-z0-9\-_]{20,}\b",                     # API key patterns (longer threshold)
    r"eyJ[A-Za-z0-9\-_]{20,}\.[A-Za-z0-9\-_]{20,}\.[A-Za-z0-9\-_]{20,}",  # full JWT only
    r"Bearer\s+eyJ[A-Za-z0-9\-_.]{20,}",                       # full Bearer tokens only
]

MEDICAL_DISCLAIMER = (
    "\n\n---\n"
    "⚕️ *I can share information from your records, but I'm not a medical professional. "
    "Always consult your doctor or pharmacist before making any changes to your medication.*"
)


def validate_output(response: str) -> tuple[bool, str]:
    """
    Validates and sanitizes the agent's response before sending to the user.

    Returns:
        (True, clean_response)   → response is safe, return it
        (False, fallback_message) → response had issues, return fallback
    """
    if not response or not response.strip():
        return False, "I wasn't able to generate a response. Please try again."

    # Truncate if too long
    if len(response) > MAX_RESPONSE_LENGTH:
        response = response[:MAX_RESPONSE_LENGTH].rstrip() + (
            "...\n\n*(Response was truncated. Please ask a more specific question.)*"
        )

    # Check for data leaks
    for pattern in LEAK_PATTERNS:
        if re.search(pattern, response):
            return False, (
                "I encountered an issue generating a safe response. Please try again."
            )

    return True, response


def add_medical_disclaimer(response: str) -> str:
    """Appends the medical disclaimer to a response."""
    return response + MEDICAL_DISCLAIMER