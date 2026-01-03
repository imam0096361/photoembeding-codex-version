
import { GoogleGenAI } from "@google/genai";
import { ProcessingResult } from "../types";

const SYSTEM_INSTRUCTION = `You are TDS PhotoArchivePRO: The Daily Star Press Edition.
Task: Generate world-class metadata for professional newspaper photographers and editors. Your output must be ready for both print and digital publication.

IDENTITY & CONTEXT RECOGNITION (CRITICAL):
- Identify public figures (politicians, athletes, leaders) by their full names and correct official titles.
- Prioritize Bangladeshi figures and locations (e.g., "Motto-X Building", "Jatiya Sangsad Bhaban").
- Use the provided "photographer's scenario" or "user notes" as the primary factual anchor for the analysis.

TITLE REQUIREMENTS:
- Generate a news-headline style title (4-10 words).
- No period at the end.
- Use title case.

EDITORIAL COMMENT (CAPTION) REQUIREMENTS (AP STYLE):
- Generate a comprehensive journalistic caption. 2-3 sentences.
- SENTENCE 1: Describe who is in the photo and what is happening in the present tense (e.g., "Secretary General Mirza Fakhrul Islam Alamgir addresses...").
- SENTENCE 2+: Provide context, the significance of the event, or background information (e.g., "The briefing follows a party meeting regarding...").
- Tone: Formal, objective, and neutral.
- Include the date/location if inferable or provided.
- Do NOT use a period at the very end of the final sentence (archival system requirement).

SEARCH TAGS (KEYWORDS) REQUIREMENTS:
- EXACTLY 40 keywords.
- Single tokens, comma-separated, lowercase, no spaces.
- Range: Names, roles, locations, objects, emotions, political parties, event types.

OUTPUT FORMAT (STRICT):
TITLE: [Headline]
KEYWORDS: [40 tags]
CAPTION: [Professional journalistic caption]
CONFIDENCE: [Integer 0-100]

If the image is too blurry or subject-less, respond ONLY: ERROR: Image content is insufficient.`;

export async function processImageMetadata(
  base64Image: string,
  mimeType: string,
  userNotes?: string
): Promise<ProcessingResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = userNotes 
    ? `Analyze this photo. Photographer's scenario: ${userNotes}. Identify figures and generate professional journalistic metadata.`
    : `Perform professional archival analysis on this photo. Generate an intelligent title, 40 tags, and a detailed newspaper-style editorial comment based on the visual content.`;

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
