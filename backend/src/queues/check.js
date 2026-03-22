import { taskQueue } from "../src/queues/queue.js";
const userId = "6935de0bf645be2be5dd4223"; 
(async () => {
  await taskQueue.add("complaintAssigned", {
    userId,
    title: "Manual test message",
    body: "This is a manual notification test from server."
  }, { attempts: 1 });
  console.log("Enqueued test notification");
  process.exit(0);
})();


// node scripts/test-enqueue.js