import re

MAX_MESSAGE_LENGTH = 1000

# These patterns get BLOCKED — the agent never sees these messages
BLOCKED_PATTERNS = [
    # Self-harm / crisis
    (r"\b(suicide|kill myself|end my life|want to die|self.?harm)\b", "crisis"),
    (r"\b(overdose on purpose|take too many pills on purpose|dangerous dose intentionally)\b", "crisis"),
    # Prompt injection attempts
    (r"\b(ignore (all |previous |your |the )?instructions|forget (all |previous |your )?instructions)\b", "injection"),
    (r"\b(jailbreak|act as dan|do anything now|pretend you are|you are now a)\b", "injection"),
    (r"\b(system prompt|reveal your prompt|print your instructions)\b", "injection"),
    # Code injection
    (r"(<script|javascript:|on\w+\s*=|drop\s+table|select\s+\*\s+from|insert\s+into)", "code_injection"),
    # Dangerous drug info
    (r"\b(what is the lethal dose|how to poison|how much to overdose)\b", "dangerous"),
]

# These patterns are ALLOWED but trigger a medical disclaimer on the response
MEDICAL_ADVICE_PATTERNS = [
    r"\b(do i have|is this|could this be) .{0,30}(cancer|diabetes|disease|disorder|condition)\b",
    r"\b(should i (take|stop|switch|change|increase|decrease)|can i take).{0,30}(with|instead of|together)\b",
    r"\b(is it safe to take|are these safe together|drug interaction)\b",
    r"\bdiagnos(e|is|ing)\b",
]


def validate_input(message: str) -> tuple[bool, str]:
    """
    Validates the incoming user message.

    Returns:
        (True, "")                    → message is clean, proceed normally
        (True, "medical_flag")        → message is fine but needs medical disclaimer on output
        (False, "safe_error_message") → message is blocked, return this string to user
    """
    if not message or not message.strip():
        return False, "Please type a message."

    if len(message) > MAX_MESSAGE_LENGTH:
        return False, (
            f"Your message is too long ({len(message)} characters). "
            f"Please keep it under {MAX_MESSAGE_LENGTH} characters."
        )

    message_lower = message.lower()

    for pattern, category in BLOCKED_PATTERNS:
        if re.search(pattern, message_lower):
            if category == "crisis":
                return False, (
                    "I noticed something concerning in your message. "
                    "If you're going through a difficult time, please reach out for help:\n\n"
                    "🇮🇳 **iCall (India):** 9152987821\n"
                    "🌍 **International Association for Suicide Prevention:** https://www.iasp.info/resources/Crisis_Centres/\n\n"
                    "I'm a medication assistant and can't provide the support you deserve right now. "
                    "Please talk to someone who can help. 💙"
                )
            elif category == "injection":
                return False, (
                    "I can only help with questions about your medicines, reminders, and appointments. "
                    "Let me know what you'd like to know about your health data!"
                )
            else:
                return False, (
                    "I'm not able to help with that request. "
                    "I can assist with your medicines, reminders, appointments, and adherence stats."
                )

    for pattern in MEDICAL_ADVICE_PATTERNS:
        if re.search(pattern, message_lower):
            return True, "medical_flag"

    return True, ""