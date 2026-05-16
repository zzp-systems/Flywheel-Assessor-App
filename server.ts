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
      const { assessmentType, facility, unit, items, existingNotes } = req.body;

      const failedItems = items.filter((i: any) => i.status === 'Fail');
      const passedItems = items.filter((i: any) => i.status === 'Pass');
      
      let prompt = `You are a professional property assessor generating a highly detailed, forensic condition summary for a Texas self-storage unit for Flywheel Investors.
        
Assessment Type: ${assessmentType}
Facility: ${facility || 'Unknown'}
Unit: ${unit || 'Unknown'}

Input Findings (FAILED):
${failedItems.map((i: any) => `- [Tier: ${i.tier}] ${i.text}: ${i.note ? `(OBSERVATION: ${i.note})` : 'No specific note provided'}`).join('\n')}

Input Findings (PASSED):
${passedItems.map((i: any) => `- [Tier: ${i.tier}] ${i.text}`).join('\n')}

${existingNotes ? `Field Notes / Context from Assessor:\n${existingNotes}\n` : ''}

CRITICAL GENERATION INSTRUCTIONS:
1. STRUCTURE: Write the entire summary as a SINGLE comprehensive, professional paragraph. Do NOT use bullet points, subheadings, lists, or multiple paragraphs.
2. LENGTH: The summary MUST exceed 700 characters. Use descriptive, technical language to provide a thorough overview of the unit's state.
3. CORE MISSION: Synthesize findings across all four operational categories:
    - LIFE SAFETY (Red Tier): Analyze implications of fire safety, structural hazards, and emergency egress compliance.
    - CONDITION & HABITABILITY (Yellow Tier): Detail the functional state of doors, floor hygiene, and wall structural integrity.
    - RENT-READY VISUALS (Green Tier): Evaluate the aesthetic marketability and presentation standards.
    - ACCESS CREDENTIALS (Slate Tier): Confirm the chain of custody for unit access hardware and fobs.
4. DEFENSIVE WRITING: Focus on the IMPLICATIONS of any failed items. How do they affect safety, liability, or the Rent-Ready status? Use a legally defensive, "Special Ops" reporting tone suitable for Texas Property Code compliance.
5. NO FILLER: Start immediately with the assessment data. Do NOT include greetings, introductions like "This report covers...", or concluding remarks. Begin with a professional assessment sentence.`;

      const response = await gAI.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      const text = response.text;

      res.json({ summary: text });
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
