import express from "express";
const router = express.Router();
import { chatbot, clearChatSession } from "../controllers/chatbot.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

router.post("/", verifyJwt, chatbot);
router.delete("/session/:sessionId", verifyJwt, clearChatSession);

export default router;