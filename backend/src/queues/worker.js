import { Worker } from "bullmq";
import { User } from "../model/user.model.js";
import { sendNotification, sendEmail } from "../firebase/SendNotification.js";
const buildEmailHTML = ({ title, username, description, status, deadline, extraMessage }) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 15px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #2c3e50;">${title}</h2>
      ${username ? `<p>Hi <strong>${username}</strong>,</p>` : "<p>Hello,</p>"}
      ${extraMessage ? `<p>${extraMessage}</p>` : ""}
      <hr />
      ${description ? `<p><strong>Details:</strong> ${description}</p>` : ""}
      ${status ? `<p><strong>Status:</strong> ${status}</p>` : ""}
      ${deadline ? `<p><strong>Deadline:</strong> ${new Date(deadline).toLocaleString()}</p>` : ""}
      <br/>
      <p style="font-size: 0.9em; color: #7f8c8d;">— CareSphere Team</p>
    </div>
  `;
};

export const worker = new Worker(
  "task-queue",
  async (job) => {
    console.log(`[Worker] Processing job: ${job.name} (${job.id})`);

    const { 
      userId, 
      medicineId, 
      title, 
      body, 
      description, 
      status, 
      deadline, 
      extraMessage, 
      toEmail, 
      inviterName 
    } = job.data;

    let user = null;
    if (userId) {
      user = await User.findById(userId);
    }

    if (job.name === "sendNotification" && user) {
      if (user.fcmToken) {
        try {
          const medicinePayload = {
            _id: medicineId || "N/A",
            medicineName: title || "Medicine Reminder",
            dosage: body || "Please take your scheduled dose",
          };
          await sendNotification(user.fcmToken, medicinePayload, user._id);
          console.log(`[Worker] FCM sent to user: ${user.username}`);
        } catch (err) {
          console.error("[Worker] FCM Push Failed:", err);
        }
      }
    }

    if (job.name === "sendEmail" || job.data.sendEmail) {
      try {
        const recipientEmail = user ? user.email : toEmail;
        
        if (!recipientEmail) {
          console.error("[Worker] No recipient email found. Skipping email job.");
          return;
        }

        const htmlContent = buildEmailHTML({
          title: title || "CareSphere Update",
          username: user ? user.username : null, 
          description: description || body,
          status,
          deadline,
          extraMessage: extraMessage || (inviterName ? `${inviterName} invited you to CareSphere.` : null)
        });

        await sendEmail(recipientEmail, title || "CareSphere Reminder", htmlContent);
        console.log(`[Worker] Email sent successfully to: ${recipientEmail}`);
      } catch (err) {
        console.error("[Worker] Email sending failed:", err);
      }
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT) || 6379,
      family: 4
    },
    concurrency: 5
  }
);

worker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed.`);
});

worker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job.id} failed: ${err.message}`);
});