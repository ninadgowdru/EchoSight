import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const hasEnvKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    service: 'EchoSight Visual Assistant Backend',
    model: 'gemini-1.5-flash',
    hasApiKey: hasEnvKey,
    timestamp: new Date().toISOString(),
  });
});

// Analyze image + voice query with Gemini 1.5 Flash
app.post('/api/analyze', async (req, res) => {
  const startTime = Date.now();
  try {
    const { image, question, customApiKey } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(401).json({
        error: 'Gemini API Key missing. Please configure GEMINI_API_KEY in your server environment variables or enter it in the app settings.',
      });
    }

    // Clean base64 image data
    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (image.includes(';base64,')) {
      const parts = image.split(';base64,');
      mimeType = parts[0].replace('data:', '') || 'image/jpeg';
      base64Data = parts[1];
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      systemInstruction: `You are EchoSight, a rapid, compassionate visual assistance AI designed specifically for blind and visually impaired individuals.
The user is pointing their camera at their surroundings and asking a question.
Your response will be spoken directly to their ears via Text-to-Speech in under 2 seconds.

STRICT RULES:
1. Answer in 1 to 2 concise, natural, spoken sentences.
2. Directly answer their question first with high priority.
3. Provide precise spatial guidance (e.g. "directly ahead about two steps", "to your immediate right at hand height", "on the floor three feet away").
4. If there is a tripping hazard, obstacle, drop-off, or danger, announce it immediately.
5. NEVER use markdown symbols (*, #, _, -), emojis, bullet points, or lists, as speech synthesizers read these awkwardly.
6. If the camera is covered, pitch black, or too blurry to tell, state calmly: "The camera view is unclear or too dark. Try pointing higher or turning on the flashlight."`,
    });

    const promptText = question && question.trim().length > 0
      ? question.trim()
      : 'What is directly in front of me and are there any obstacles?';

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([promptText, imagePart]);
    const response = await result.response;
    let answer = response.text()?.trim() || 'I could not determine what is in front of you. Please try again.';

    // Clean any accidental markdown stars or hashes
    answer = answer.replace(/[*#_~`]/g, '').trim();

    const durationMs = Date.now() - startTime;

    return res.json({
      success: true,
      answer,
      question: promptText,
      durationMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error('Gemini API Error:', error);

    const errorMessage = error.message || 'Failed to analyze camera image';
    return res.status(500).json({
      success: false,
      error: errorMessage,
      durationMs,
    });
  }
});

// Serve frontend build in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Catch-all route for SPA client navigation
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[EchoSight Server] Running on http://localhost:${PORT}`);
  console.log(`[EchoSight Server] Gemini API Key configured: ${Boolean(process.env.GEMINI_API_KEY)}`);
});
