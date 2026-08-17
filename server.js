import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({
    ok: Boolean(process.env.GEMINI_API_KEY)
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();

    if (!message) {
      return res.status(400).json({
        error: "No message received."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing."
      });
    }

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction: `
You are JARVIS, an intelligent personal AI assistant.

Understand natural human language, follow-up questions,
misspellings, casual speech and incomplete sentences.

Be helpful, concise and conversational.

If the user wants a web action, return an action.
Supported actions:

google
youtube
maps
weather
timer

Otherwise return action as null.

Return JSON only.
        `,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            reply: {
              type: "string"
            },
            action: {
              type: "object",
              nullable: true,
              properties: {
                type: {
                  type: "string"
                },
                query: {
                  type: "string",
                  nullable: true
                },
                seconds: {
                  type: "number",
                  nullable: true
                }
              },
              required: ["type"]
            }
          },
          required: ["reply", "action"]
        }
      }
    });

    const result = JSON.parse(response.text);

    res.json(result);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Gemini request failed."
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );
});

app.listen(PORT, () => {
  console.log(`JARVIS running at http://localhost:${PORT}`);
});
