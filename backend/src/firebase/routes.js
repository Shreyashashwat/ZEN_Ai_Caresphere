import express from "express";
import {User} from "../model/user.model.js"; 
const router = express.Router();
// Save FCM token
router.post("/", async (req, res) => {
  const { userId, token } = req.body;
  await User.findByIdAndUpdate(userId, { fcmToken: token });
  res.send("Token saved!");
});
export default router;