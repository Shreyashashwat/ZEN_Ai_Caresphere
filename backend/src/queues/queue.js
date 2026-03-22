import { Queue } from "bullmq";
import dotenv from "dotenv";
dotenv.config();

const redisOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT) || 6379,
  family: 4,
  maxRetriesPerRequest: null,
};

export const taskQueue = new Queue("task-queue", {
  connection: redisOptions,
});

console.log("Attempting Queue Connection:", redisOptions);