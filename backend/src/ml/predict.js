import { spawn } from "child_process";
import path from "path";

export const predictAdherenceRisk = (hour, dayOfWeek, delay) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve("./src/ml/predict.py");
    const py = spawn("python", [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });

    const payload = {
      hour: Number(hour),
      dayOfWeek: Number(dayOfWeek),
      delay: Math.max(0, Number(delay))
    };

    py.stdin.write(JSON.stringify(payload));
    py.stdin.end();

    let result = "";

    py.stdout.on("data", (data) => (result += data.toString()));
    py.stderr.on("data", (err) =>
      console.error("Python stderr:", err.toString())
    );

    py.on("close", (code) => {
      const value = parseFloat(result.trim());
      if (!Number.isNaN(value)) resolve(value);
      else reject(new Error(`Invalid ML output (code ${code})`));
    });
  });
};

