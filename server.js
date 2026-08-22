require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Gemini AI Chat Route
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY in .env file." });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are JARVIS, an intelligent and witty AI assistant. Keep responses concise, direct, and conversational (under 3 sentences unless asked for more). User: ${prompt}`
          }]
        }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I didn't receive a response.";
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback to index.html for any other route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`JARVIS running at http://localhost:${PORT}`);
});
