
import { GoogleGenAI } from "@google/genai";
import { ProcessingResult } from "../types";

const SYSTEM_INSTRUCTION = `You are TDS PhotoArchivePRO: The Daily Star Press Edition.
Task: Generate world-class metadata for press photographers. You provide high-precision Titles, Editorial Comments, and Search Tags.

IDENTITY RECOGNITION (HIGH PRIORITY):
- Identify public figures (politicians, athletes, leaders) by full names.
- For Bangladeshi context, prioritize identifying local figures accurately.
- If a person is identified, they must be the focus of the title and comment.
- ABSOLUTELY NO HALLUCINATION: If unsure of identity, use descriptive roles (e.g., "cricketer", "official").

TITLE REQUIREMENTS:
- Generate a short, punchy, news-headline style title (3-8 words).
- No period at the end.
- Example: "Prime Minister Addresses National Summit" or "Local Fishermen at Sundarbans".

EDITORIAL COMMENT (CAPTION) REQUIREMENTS:
- Exactly 1 descriptive sentence. No period at end.
- Neutral, literal, and objective journalistic tone.
- Format: "[Subject] [Action] [Context] in [Location]" (if known).

SEARCH TAGS (KEYWORDS) REQUIREMENTS:
- EXACTLY 40 keywords.
- Single tokens, comma-separated, lowercase, no spaces.
- No duplicates.

OUTPUT FORMAT (STRICT):
TITLE: [Headline]
KEYWORDS: [40 tags]
CAPTION: [Single sentence comment]
CONFIDENCE: [Integer between 0 and 100]

If image is too blurry or subject-less, respond ONLY: ERROR: Image content is insufficient.`;

export async function processImageMetadata(
  base64Image: string,
  mimeType: string,
  userNotes?: string
): Promise<ProcessingResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = userNotes 
    ? `Analyze this photo. Photographer's scenario: ${userNotes}. Identify figures and generate title, tags, and comment.`
    : `Perform archival analysis on this photo. Generate an intelligent title, 40 tags, and an editorial comment based on the visual content.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: prompt }
      ]
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.1, 
      thinkingConfig: { thinkingBudget: 0 }
    },
  });

  const textOutput = response.text || '';
  
  if (textOutput.includes('ERROR:')) {
    throw new Error('Image content is insufficient for reliable metadata generation');
  }

  const titleMatch = textOutput.match(/TITLE:\s*([\s\S]*?)(?=\n\n|KEYWORDS:|CAPTION:|CONFIDENCE:|$)/i);
  const keywordMatch = textOutput.match(/KEYWORDS:\s*([\s\S]*?)(?=\n\n|CAPTION:|CONFIDENCE:|$)/i);
  const captionMatch = textOutput.match(/CAPTION:\s*([\s\S]*?)(?=\n\n|CONFIDENCE:|$)/i);
  const confidenceMatch = textOutput.match(/CONFIDENCE:\s*(\d+)/i);

  if (!keywordMatch || !captionMatch) {
    throw new Error('Metadata engine failed to parse output. Please retry.');
  }

  const title = titleMatch ? titleMatch[1].trim() : 'Untitled Photo';
  const keywords = keywordMatch[1].trim().replace(/\n/g, '').replace(/\s/g, '');
  const caption = captionMatch[1].trim().replace(/\.$/, '');
  const confidenceScore = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 0;

  return {
    title,
    keywords,
    caption,
    confidenceScore
  };
}