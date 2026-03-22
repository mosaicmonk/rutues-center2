import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { askPlanningAI, getProviderStatus } from "./providers/aiProvider.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/ai/health", async (_req, res) => {
  try {
    const status = await getProviderStatus();
    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unable to read provider status",
    });
  }
});

app.post("/ai", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({
        success: false,
        error: "A string message is required.",
      });
      return;
    }

    const response = await askPlanningAI(message);

    res.json({
      success: true,
      provider: response.provider,
      model: response.model,
      reply: response.reply,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "AI request failed",
    });
  }
});

app.listen(3000, () => {
  console.log("Rutues Center AI server running on port 3000");
});
