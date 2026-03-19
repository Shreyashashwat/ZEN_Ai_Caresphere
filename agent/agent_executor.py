import os
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv


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
