import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface GeminiResult {
  category: string; sentiment: 'Positive' | 'Neutral' | 'Negative';
  priority_score: number; summary: string; tags: string[];
}

export async function analyzeWithGemini(title: string, description: string): Promise<GeminiResult | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Analyse this product feedback. Return ONLY valid JSON, no markdown, no backticks.
Title: "${title}"
Description: "${description}"
Return exactly:
{"category":"Bug|Feature Request|Improvement|Other","sentiment":"Positive|Neutral|Negative","priority_score":5,"summary":"one sentence","tags":["tag1","tag2"]}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/gi, '').trim();
    return JSON.parse(text) as GeminiResult;
  } catch (err) {
    console.error('Gemini error:', err);
    return null;
  }
}