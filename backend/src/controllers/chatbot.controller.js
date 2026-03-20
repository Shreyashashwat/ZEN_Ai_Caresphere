import 'dotenv/config';
import { InferenceClient } from "@huggingface/inference";
import { Medicine } from "../model/medicine.model.js";

const fetchHistory = async (userId) => {
  const medicines = await Medicine.find({ userId }).populate("statusHistory");

  const history = medicines.flatMap((med) =>
    med.statusHistory.map((status) => ({
      medicineName: med.medicineName,
      dosage: med.dosage,
      frequency: med.frequency,
      time: status.time,
      status: status.status,
      userResponseTime: status.userResponseTime,
    }))
  );


  history.sort((a, b) => new Date(b.time) - new Date(a.time));
  console.log(history);
  return history;
};

const hfApiToken = process.env.HUGGINGFACEHUB_API_TOKEN;
if (!hfApiToken) throw new Error("HUGGINGFACEHUB_API_TOKEN is not defined");
const client = new InferenceClient(hfApiToken);

export const chatbot = async (req, res) => {
  try {
    const { userId, message } = req.body;

    // Use req.user set by verifyJwt middleware
    if (req.user.toString() !== userId.toString()) {
  return res.status(403).json({ error: "Unauthorized" });
}


    const userData = await fetchHistory(userId);
    const contextString = userData.length
      ? `Medicine history: ${JSON.stringify(userData)}`
      : "No medication data found.";

    const messages = [
      { role: "system", content: `You are a medical assistant chatbot. Use the following user data to answer: ${contextString}` },
      { role: "user", content: message },
    ];

    const response = await client.chatCompletion({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      messages,
      max_tokens: 512,
      temperature: 0.7,
    });

    const reply = response.choices?.[0]?.message?.content ?? "";
    return res.json({ reply });

  } catch (err) {
    console.error("Error in /chatbot:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};