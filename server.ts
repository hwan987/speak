import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI if key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

// Endpoint for AI-powered Mom feedback following Section 7 of PRD
app.post('/api/feedback', async (req: Request, res: Response) => {
  const {
    stageName,
    partnerSentence,
    studentTarget,
    transcript,
    isSuccess,
    isSmallWordMissing,
    missingKeyWords,
    missingSmallWords,
    failureCount,
    ruleBasedFeedbackEn,
    ruleBasedFeedbackKo,
  } = req.body;

  // If no AI client available or empty transcript, return rule-based directly
  if (!aiClient || !transcript || transcript.trim().length === 0) {
    return res.json({
      feedbackEn: ruleBasedFeedbackEn,
      feedbackKo: ruleBasedFeedbackKo,
      source: 'rule-based',
    });
  }

  try {
    const prompt = `You are "Mom" in a speaking practice app for Korean 8th grade middle school students (CEFR A2).
The conversation context: You were worried about homework, but you want to understand your child's feelings.
Stage: ${stageName}
Mom's previous statement: "${partnerSentence}"
Target sentence student should say: "${studentTarget}"
What student actually said: "${transcript}"
Evaluation: ${
      isSuccess
        ? isSmallWordMissing
          ? 'Success, but omitted small words: ' + (missingSmallWords || []).join(', ')
          : 'Complete Success'
        : `Failed attempt #${(failureCount || 0) + 1}. Missing key words: ${(missingKeyWords || []).join(', ')}`
    }

Strict Rules:
1. Praise first and correct only ONE thing at a time.
2. Max 2 sentences: one simple English sentence (A2 level), followed by natural Korean in parentheses.
3. Judge by "Did Mom understand?", NOT pronunciation or native accent.
4. Never say "wrong", never give percentage scores, never explain tongue/mouth position.
5. If failed:
   - 1st failure: Recast naturally (e.g. Nice try! You can say, "${studentTarget}." (좋아요! 이 문장으로 다시 말해 볼까요?))
   - 2nd failure: Elicitation hint for the missing word.
   - 3rd+ failure: Chunking into 2 parts.
6. If success: Warm acknowledgement showing Mom understands and feels relieved.
Output strictly JSON:
{
  "feedbackEn": "English sentence",
  "feedbackKo": "Korean translation/support"
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      if (parsed.feedbackEn && parsed.feedbackKo) {
        return res.json({
          feedbackEn: parsed.feedbackEn,
          feedbackKo: parsed.feedbackKo,
          source: 'gemini',
        });
      }
    }
    // Fallback to rule-based if output format unexpected
    return res.json({
      feedbackEn: ruleBasedFeedbackEn,
      feedbackKo: ruleBasedFeedbackKo,
      source: 'rule-based',
    });
  } catch (error) {
    console.error('Gemini feedback error, falling back to rule-based:', error);
    return res.json({
      feedbackEn: ruleBasedFeedbackEn,
      feedbackKo: ruleBasedFeedbackKo,
      source: 'rule-based',
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
