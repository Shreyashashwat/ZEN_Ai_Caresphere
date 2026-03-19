import { spawn } from "child_process";

import { getTrainingData } from "./dataPrep.js";
import path from "path";

export const trainAdherenceModel = async () => {
  const data = await getTrainingData();

  return new Promise((resolve, reject) => {
    const py = spawn("python", [path.resolve("./src/ml/train_model.py")]);

    py.stdin.write(JSON.stringify(data));
    py.stdin.end();

   py.stdout.on("data", (data) => {
  console.log("Python stdout:", data.toString());
});
py.stderr.on("data", (err) => {
  console.error("Python stderr:", err.toString());
});


    py.on("close", (code) => {
      if (code === 0) resolve("Training complete");
      else reject("Training failed");
    });
  });
};
