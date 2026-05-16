import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

// Initialize SDK lazily
let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API Route for Gemini
  app.post('/api/suggest-summary', async (req, res) => {
    try {
      const gAI = getAI();
      const { assessmentType, facility, unit, failedItems, existingNotes } = req.body;
      
      let prompt = `You are a professional property inspector generating a concise condition summary for a Texas self-storage unit.
        
Assessment Type: ${assessmentType}
Facility: ${facility || 'Unknown'}
Unit: ${unit || 'Unknown'}

Failed Items:
${failedItems.map((i: any) => `- ${i.text} (Note: ${i.note || 'None'})`).join('\n')}`;

      if (existingNotes) {
        prompt += `\n\nExisting Notes:\n${existingNotes}`;
      }
        
      prompt += `\n\nGenerate a concise, professional, bullet-point summary of the unit's condition. Focus ONLY on the issues found. Do NOT include greetings or standard opening statements. Be direct and objective suitable for a legal or formal business report.`;

      const response = await gAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      res.json({ summary: response.text });
    } catch (error) {
      console.error('Gemini API Error:', error);
      res.status(500).json({ error: 'Failed to generate summary' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
