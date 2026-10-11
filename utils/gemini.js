const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODELS = [process.env.GEMINI_MODEL, process.env.GEMINI_FALLBACK_MODEL]
  .filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function askGemini(prompt, userName) {
  let lastError;

  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction:
              `You are a friendly Discord bot called bot-for-node. ` +
              `The person talking to you is named ${userName}; greet them by name when they greet you. ` +
              `Keep answers clear and under 1500 characters.`,
          },
        });
        return response.text;
      } catch (err) {
        lastError = err;
        const retryable = err.status === 503 || err.status === 429;
        if (!retryable) throw err;          // wrong key, bad model name, etc.
        await sleep(attempt * 2000);        // wait 2s, 4s, 6s
      }
    }
  }
  throw lastError;
}

module.exports = { askGemini };