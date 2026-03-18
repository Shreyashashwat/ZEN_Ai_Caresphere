import 'dotenv/config';
import axios from 'axios';
import { User } from '../model/user.model.js';
import { Medicine } from '../model/medicine.model.js';

const AGENT_URL = process.env.PYTHON_AGENT_URL || "http://localhost:8002";

export const chatbot = async (req, res) => {
  try {
    const { userId, message, sessionId } = req.body;

    const loggedInUserId = req.user._id || req.user.id;
    if (!loggedInUserId || loggedInUserId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!message?.trim()) return res.status(400).json({ error: "Message is required" });
    if (!sessionId)        return res.status(400).json({ error: "sessionId is required" });

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token found" });

    // ── Fetch user context (name, age, gender + active medicines) ────────────
    const [user, medicines] = await Promise.all([
      User.findById(loggedInUserId).select("username age gender"),
      Medicine.find({ userId: loggedInUserId }).select("medicineName  dosage frequency").lean(),
    ]);

    const userContext = {
      name:      user?.username  || "the user",
      age:       user?.age       || null,
      gender:    user?.gender    || null,
      medicines: medicines.map(m => ({
      name:      m.medicineName,   // ← fixed

        dosage:    m.dosage,
        frequency: m.frequency,
      })),
    };
    // ─────────────────────────────────────────────────────────────────────────

    const agentResponse = await axios.post(
      `${AGENT_URL}/chat`,
      { userId, message, token, sessionId, userContext },
      { timeout: 90000 }
    );

    return res.json({
      reply:     agentResponse.data.reply,
      sessionId: agentResponse.data.sessionId,
    });

  } catch (err) {
    console.error("Agent call failed:", err?.response?.data || err.message);
    const isTimeout  = err?.code === "ECONNABORTED" || err?.message?.includes("timeout");
    const statusCode = err?.response?.status || (isTimeout ? 504 : 500);
    const msg =
      statusCode === 503 ? "The AI assistant is currently unavailable. Please try again shortly."
      : isTimeout        ? "The request took too long. Please try again."
      :                    "Something went wrong. Please try again.";
    return res.status(statusCode).json({ error: msg });
  }
};

export const clearChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    await axios.delete(`${AGENT_URL}/chat/${sessionId}`, { timeout: 5000 });
    return res.json({ status: "cleared" });
  } catch (err) {
    console.error("Clear session failed:", err.message);
    return res.status(500).json({ error: "Failed to clear session" });
  }
};