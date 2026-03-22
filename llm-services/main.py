
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import os
from dotenv import load_dotenv
load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

app = FastAPI()
class WeeklySummary(BaseModel):
    adherence_percentage: int
    missed_doses: int
    most_missed_time: str
    

class Insight(BaseModel):
    text: str
    category: str
    priority: str

class LLMResponse(BaseModel):
    insights: List[Insight]


llm = ChatGoogleGenerativeAI(
    model="gemini-flash-latest",
    temperature=0.7,
    google_api_key=os.getenv("GOOGLE_API_KEY")
)
    

parser = JsonOutputParser(pydantic_object=LLMResponse)

prompt = PromptTemplate(
    template="""
You are a health insights assistant.

Rules:
- Generate 1 to 5 insights
- No medical diagnosis
- Short, actionable sentences
- Use ONLY these priority values: "high", "medium", "low" (lowercase)
- Respond ONLY in valid JSON

JSON format:
{format_instructions}

Weekly summary:
- Adherence: {adherence_percentage}%
- Missed doses: {missed_doses}
- Most missed time: {most_missed_time}
""",
    input_variables=[
        "adherence_percentage",
        "missed_doses",
        "most_missed_time",
        
    ],
    partial_variables={
        "format_instructions": parser.get_format_instructions()
    }
)

@app.post("/generate-insights", response_model=LLMResponse)
def generate_insights(summary: WeeklySummary):
    chain = prompt | llm | parser

    result = chain.invoke({
        "adherence_percentage": summary.adherence_percentage,
        "missed_doses": summary.missed_doses,
        "most_missed_time": summary.most_missed_time,
        
    })

    return result 