import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import OpenAI from "openai"

import { registerAuthRoutes } from "./authRoutes.js"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null

registerAuthRoutes(app)

app.post("/ai", async (req, res) => {
  try {
    if (!openai) {
      res.status(503).json({
        success: false,
        error: "AI service is not configured"
      })
      return
    }

    const { message } = req.body

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an AI planning assistant that breaks goals into structured tasks."
        },
        {
          role: "user",
          content: message
        }
      ]
    })

    res.json({
      success: true,
      reply: response.choices[0].message.content
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      success: false,
      error: "AI request failed"
    })

  }
})

app.listen(3000, () => {
  console.log("Rutues Center AI server running on port 3000")
})
