import { GoogleGenAI } from '@google/genai';

interface FeedbackPayload {
  stageName?: string;
  partnerSentence?: string;
  studentTarget?: string;
  transcript?: string;
  isSuccess?: boolean;
  isSmallWordMissing?: boolean;
  missingKeyWords?: string[];
  missingSmallWords?: string[];
  failureCount?: number;
  ruleBasedFeedbackEn?: string;
  ruleBasedFeedbackKo?: string;
}

export async function POST(request: Request): Promise<Response> {
  let body: FeedbackPayload = {};
  try {
    body = (await request.json()) as FeedbackPayload;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

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
  } = body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || !transcript || transcript.trim().length === 0) {
    return Response.json({
      feedbackEn: ruleBasedFeedbackEn,
      feedbackKo: ruleBasedFeedbackKo,
      source: 'rule-based',
    });
  }

  try {
    const aiClient = new GoogleGenAI({ apiKey });
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
      const parsed = JSON.parse(text) as { feedbackEn?: string; feedbackKo?: string };
      if (parsed.feedbackEn && parsed.feedbackKo) {
        return Response.json({
          feedbackEn: parsed.feedbackEn,
          feedbackKo: parsed.feedbackKo,
          source: 'gemini',
        });
      }
    }
  } catch (error) {
    console.error('Gemini feedback error, falling back to rule-based:', error);
  }

  return Response.json({
    feedbackEn: ruleBasedFeedbackEn,
    feedbackKo: ruleBasedFeedbackKo,
    source: 'rule-based',
  });
}
