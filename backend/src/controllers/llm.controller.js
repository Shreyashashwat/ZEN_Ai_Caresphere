import axios from "axios";

export const callLLM = async (weeklySummary) => {
  const res = await axios.post(
    "http://localhost:8001/generate-insights",
    weeklySummary,
    {
      headers: { "Content-Type": "application/json" }
    }
  );

  return res.data; 
};
