import os
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load .env from agent directory (uvicorn cwd may be project root)
load_dotenv(Path(__file__).resolve().parent / ".env")

from langchain_openai import ChatOpenAI
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage

from agent.tools.medicine_tools import make_medicine_tools
from agent.tools.reminder_tools import make_reminder_tools
from agent.tools.appointment_tools import make_appointment_tools
from agent.tools.analytics_tools import make_analytics_tools
from agent.prompts.system_prompt import SYSTEM_PROMPT
from agent.guardrails.input_guardrail import validate_input
from agent.guardrails.output_guardrail import validate_output, add_medical_disclaimer


def _build_agent(token: str, user_id: str, system_prompt: str) -> AgentExecutor:
    """Accepts a pre-built system prompt so user context is already baked in."""
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.2,
        openai_api_key=os.getenv("OPENAI_API_KEY"),
    )

    all_tools = (
        make_medicine_tools(token)
        + make_reminder_tools(token)
        + make_appointment_tools(token)
        + make_analytics_tools(token, user_id)
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    agent = create_tool_calling_agent(llm, all_tools, prompt)

    return AgentExecutor(
        agent=agent,
        tools=all_tools,
        verbose=True,
        max_iterations=6,
        handle_parsing_errors=True,
        return_intermediate_steps=False,
    )


def _build_user_context_block(user_context: dict) -> str:
    """Build the user context string injected into the system prompt per request."""
    if not user_context:
        # Even with no user context, always inject the real date
        now = datetime.now()
        return (
            f"\n## DATE & TIME\n"
            f"- Today's date: {now.strftime('%A, %B %d, %Y')}\n"
            f"- Current time: {now.strftime('%I:%M %p')}\n"
            f"- Use this for ALL date calculations. Never guess dates.\n"
        )

    name   = user_context.get("name", "the user")
    age    = user_context.get("age")
    gender = user_context.get("gender")
    meds   = user_context.get("medicines", [])

    # Always use real server time — never let the LLM guess
    now = datetime.now()
    current_date = now.strftime("%A, %B %d, %Y")   # e.g. Monday, March 03, 2026
    current_time = now.strftime("%I:%M %p")          # e.g. 06:45 PM
    tomorrow     = now.replace(day=now.day + 1).strftime("%B %d, %Y") if now.day < 28 else (
        datetime(now.year, now.month + 1 if now.month < 12 else 1, 1)
        .strftime("%B %d, %Y")
    )

    lines = ["\n## ABOUT THIS USER (always use this to personalise answers)"]

    # Date always comes first so the LLM sees it immediately
    lines.append(f"- Today's date: {current_date}")
    lines.append(f"- Current time: {current_time}")
    lines.append(f"- Tomorrow's date: {tomorrow}")
    lines.append(f"- Use these dates for ALL scheduling. Never guess or assume dates.")

    lines.append(f"- Name: {name.title()}")
    if age:    lines.append(f"- Age: {age}")
    if gender: lines.append(f"- Gender: {gender}")

    if meds:
        med_list = ", ".join(
            f"{m['name']} ({m.get('dosage', '')} {m.get('frequency', '')}".strip(" ()") + ")"
            for m in meds
        )
        lines.append(f"- Current medicines: {med_list}")
        lines.append(
            "- When answering health questions, consider these medicines. "
            "If a symptom or question relates to a known side effect or interaction, "
            "gently mention it and suggest speaking with their doctor."
        )
    else:
        lines.append("- No medicines currently tracked.")

    lines.append(
        f"- Always address the user by their first name ({name.title()}) to feel warm and personal."
    )
    lines.append("")
    return "\n".join(lines)


def run_agent(
    token: str,
    user_id: str,
    message: str,
    chat_history: list = None,
    user_context: dict = None,
) -> str:
    is_valid, flag = validate_input(message)
    if not is_valid:
        return flag

    medical_flag = flag == "medical_flag"

    formatted_history = []
    if chat_history:
        for msg in chat_history:
            if msg.get("role") == "user":
                formatted_history.append(HumanMessage(content=msg["content"]))
            elif msg.get("role") == "assistant":
                formatted_history.append(AIMessage(content=msg["content"]))

    # Build personalised system prompt with real date + user context
    context_block = _build_user_context_block(user_context)
    personalised_prompt = SYSTEM_PROMPT + context_block

    try:
        executor = _build_agent(token, user_id, personalised_prompt)
        result = executor.invoke({
            "input": message,
            "chat_history": formatted_history,
        })
        response = result.get("output", "").strip()

        if not response:
            return "I wasn't able to process that. Could you rephrase?"

    except Exception as e:
        import traceback
        error_str = str(e)
        print(f"[Agent Error] user={user_id} | error={error_str}")
        print(traceback.format_exc())

        if "429" in error_str or "rate_limit" in error_str.lower():
            return "I'm temporarily unavailable due to high demand. Please try again in a minute. ⏳"
        if "API_KEY" in error_str or "authentication" in error_str.lower():
            return "There's a configuration issue on our end. Please contact support."
        return "I ran into an issue processing your request. Please try again."

    is_safe, sanitized_response = validate_output(response)
    if not is_safe:
        return sanitized_response

    if medical_flag:
        sanitized_response = add_medical_disclaimer(sanitized_response)

    return sanitized_response