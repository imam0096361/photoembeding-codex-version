
import { GoogleGenAI } from "@google/genai";
import { ProcessingResult, NewsCategory, CaptionStyle, CAPTION_STYLES, EventTemplate } from "../types";
import { findRelevantFigures, formatFiguresForPrompt } from "../data/knownFigures";
import { getTemplateById } from "../data/eventTemplates";

/**
 * TDS PhotoArchivePRO - Enhanced Gemini Service v2.0
 * 
 * Improvements:
 * - Deep thinking mode enabled (thinkingBudget: 2048)
 * - Verification protocol for person identification
 * - Category auto-detection
 * - OCR text extraction
 * - Known figures database integration
 * - Event template support
 * - Multi-style caption generation
 * - Structured keyword generation (WHO/WHAT/WHERE/CONTEXT)
 */

const SYSTEM_INSTRUCTION = `You are TDS PhotoArchivePRO: The Daily Star Press Edition v2.0.
Task: Generate world-class metadata for professional newspaper photographers and editors. Your output must be ready for both print and digital publication.

═══════════════════════════════════════════════════════════════════
IDENTITY & CONTEXT RECOGNITION (CRITICAL)
═══════════════════════════════════════════════════════════════════

VERIFICATION PROTOCOL:
- If you identify a person by name, state WHY in VERIFICATION field (clothing, badge, known face, context clue, user notes).
- If identification is uncertain, use descriptive terms instead ("a senior government official" vs "Minister X").
- Never guess names - use "unidentified" + description if unsure.
- Cross-reference with any "Known Figures Reference" provided in the prompt.

PERSON IDENTIFICATION PRIORITIES:
1. User-provided context/scenario notes (PRIMARY SOURCE OF TRUTH)
2. Visible name badges, placards, or signage
3. Known famous figures database (if provided)
4. Distinctive visual features or attire
5. Contextual inference (setting, other people present)

BANGLADESHI FOCUS:
- Prioritize Bangladeshi figures and locations (e.g., "Jatiya Sangsad Bhaban", "Sher-e-Bangla Stadium").
- Use standard English transliterations for Bangla names (e.g., "Sheikh" not "Shekh").
- Include both formal titles and common names.

═══════════════════════════════════════════════════════════════════
TEXT EXTRACTION (OCR)
═══════════════════════════════════════════════════════════════════

READ ALL VISIBLE TEXT:
- Signs, banners, protest placards
- Name badges, nameplates, podium signage
- Organization logos, event branding
- Document text if readable
- Include extracted text in EXTRACTED_TEXT field.

═══════════════════════════════════════════════════════════════════
TITLE REQUIREMENTS
═══════════════════════════════════════════════════════════════════

- Generate a news-headline style title (4-10 words).
- No period at the end.
- Use title case.
- Be specific, not generic (avoid "Person Speaks at Event").

═══════════════════════════════════════════════════════════════════
SECTION CLASSIFICATION
═══════════════════════════════════════════════════════════════════

Categorize this image into EXACTLY ONE news desk:
- POLITICS: Government, elections, diplomacy, parliament, ministers
- SPORTS: Matches, athletes, tournaments, stadiums, BCB, BFF
- ENTERTAINMENT: Arts, culture, celebrities, music, film, theater
- BUSINESS: Economy, corporations, finance, trade, markets, RMG
- NATIONAL: Local news, domestic events, education, health
- INTERNATIONAL: Foreign affairs, global events, diplomacy
- LIFESTYLE: Fashion, food, travel, festivals, celebrations
- CRIME: Courts, police, accidents, investigations, judiciary
- ENVIRONMENT: Climate, nature, pollution, conservation
- TECHNOLOGY: Innovation, startups, digital, science

═══════════════════════════════════════════════════════════════════
EDITORIAL COMMENT (CAPTION) REQUIREMENTS
═══════════════════════════════════════════════════════════════════

STYLE ENFORCEMENT:
- Generate a comprehensive, professional caption based exactly on the requested style.
- PAY STRICT ATTENTION to the "CAPTION STYLE OVERRIDE" in the user prompt.
- If no style is specified, default to neutral, formal journalistic language.
- Include date/location/significance if inferable or provided.
- Do NOT use a period at the very end of the final sentence.

═══════════════════════════════════════════════════════════════════
SEARCH TAGS (KEYWORDS) REQUIREMENTS
═══════════════════════════════════════════════════════════════════

Generate EXACTLY 40 keywords organized as:
- Keywords 1-10: PRIMARY SUBJECTS (WHO) - Names, roles, organizations
- Keywords 11-20: ACTIONS & EVENTS (WHAT) - Verbs, event types, actions
- Keywords 21-30: LOCATIONS & SETTINGS (WHERE) - Places, venues, geography
- Keywords 31-40: CONTEXT & EMOTIONS (WHY/HOW) - Mood, significance, legacy terms

Format: Single tokens, comma-separated, lowercase, no spaces.

═══════════════════════════════════════════════════════════════════
IMAGE QUALITY ASSESSMENT
═══════════════════════════════════════════════════════════════════

Evaluate:
- SHARPNESS: excellent / good / acceptable / poor
- EXPOSURE: correct / overexposed / underexposed
- COMPOSITION: Describe briefly (e.g., "centered subject", "rule of thirds")
- PRINT_READY: yes / no

═══════════════════════════════════════════════════════════════════
CONFIDENCE SCORING BREAKDOWN
═══════════════════════════════════════════════════════════════════

- 90-100: Clear subjects, readable text, verifiable context, high certainty identifications
- 70-89: Good visibility, reasonable inferences, most identifications confident
- 50-69: Partial visibility, context-dependent, some uncertainty
- 30-49: Significant uncertainty, recommend manual verification
- Below 30: Speculative, require extensive manual review

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT (STRICT - FOLLOW EXACTLY)
═══════════════════════════════════════════════════════════════════

TITLE: [Headline in title case, no period]
CATEGORY: [One of: politics, sports, entertainment, business, national, international, lifestyle, crime, environment, technology]
KEYWORDS: [Exactly 40 comma-separated lowercase tags]
CAPTION: [Professional journalistic caption, no final period]
EXTRACTED_TEXT: [Any readable text from signs/badges/banners, or "None visible"]
IDENTIFIED_FIGURES: [List of identified people with roles, or "No specific individuals identified"]
VERIFICATION: [Why you identified each person - evidence used]
QUALITY_SHARPNESS: [excellent/good/acceptable/poor]
QUALITY_EXPOSURE: [correct/overexposed/underexposed]
QUALITY_COMPOSITION: [Brief description]
QUALITY_PRINT_READY: [yes/no]
CONFIDENCE: [Integer 0-100]

═══════════════════════════════════════════════════════════════════

If the image is too blurry or subject-less, respond ONLY: ERROR: Image content is insufficient for reliable metadata generation.`;

export interface ProcessingOptions {
  captionStyle?: CaptionStyle;
  templateId?: string;
  enableVerification?: boolean;
  highAccuracyMode?: boolean;
}

export async function processImageMetadata(
  base64Image: string,
  mimeType: string,
  userNotes?: string,
  options: ProcessingOptions = {}
): Promise<ProcessingResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Build context-aware prompt
  let contextSection = '';
  let figuresSection = '';
  let templateSection = '';
  let styleSection = '';

  // Find relevant known figures based on user notes
  if (userNotes) {
    const relevantFigures = findRelevantFigures(userNotes);
    if (relevantFigures.length > 0) {
      figuresSection = formatFiguresForPrompt(relevantFigures);
    }
  }

  // Apply event template if specified
  if (options.templateId) {
    const template = getTemplateById(options.templateId);
    if (template) {
      templateSection = `
EVENT CONTEXT (Pre-configured Template - "${template.name}"):
${template.contextPrompt}
Suggested keywords to consider: ${template.suggestedKeywords.join(', ')}
`;
    }
  }

  // Apply caption style if not default
  if (options.captionStyle && options.captionStyle !== 'ap') {
    const style = CAPTION_STYLES.find(s => s.id === options.captionStyle);
    if (style) {
      styleSection = `
CAPTION STYLE OVERRIDE:
${style.promptModifier}
`;
    }
  }

  // Build the main prompt
  const prompt = userNotes
    ? `Analyze this photo for The Daily Star newsroom.

PHOTOGRAPHER'S SCENARIO/CONTEXT (USE AS PRIMARY FACTUAL ANCHOR):
${userNotes}
${figuresSection}
${templateSection}
${styleSection}

Generate professional journalistic metadata following the output format exactly.`
    : `Perform professional archival analysis on this photo for The Daily Star newsroom.
${figuresSection}
${templateSection}
${styleSection}

Generate an intelligent title, 40 structured tags, and a detailed newspaper-style editorial comment based on the visual content. Follow the output format exactly.`;

  // Configure thinking budget based on mode
  const thinkingBudget = options.highAccuracyMode ? 4096 : 2048;

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
      temperature: 0.2,  // Slightly increased for better context awareness
      thinkingConfig: { thinkingBudget }  // Enable deep thinking
    },
  });

  const textOutput = response.text || '';

  if (textOutput.includes('ERROR:')) {
    throw new Error('Image content is insufficient for reliable metadata generation');
  }

  // Enhanced parsing with new fields
  const titleMatch = textOutput.match(/TITLE:\s*([^\n]*?)(?=\n|CATEGORY:|$)/i);
  const categoryMatch = textOutput.match(/CATEGORY:\s*([^\n]*?)(?=\n|KEYWORDS:|$)/i);
  const keywordMatch = textOutput.match(/KEYWORDS:\s*([^\n]*?)(?=\n|CAPTION:|$)/i);
  const captionMatch = textOutput.match(/CAPTION:\s*([\s\S]*?)(?=\n\n|EXTRACTED_TEXT:|IDENTIFIED_FIGURES:|$)/i);
  const extractedTextMatch = textOutput.match(/EXTRACTED_TEXT:\s*([^\n]*?)(?=\n|IDENTIFIED_FIGURES:|$)/i);
  const identifiedFiguresMatch = textOutput.match(/IDENTIFIED_FIGURES:\s*([\s\S]*?)(?=\n\n|VERIFICATION:|$)/i);
  const verificationMatch = textOutput.match(/VERIFICATION:\s*([\s\S]*?)(?=\n\n|QUALITY_|$)/i);
  const sharpnessMatch = textOutput.match(/QUALITY_SHARPNESS:\s*([^\n]*)/i);
  const exposureMatch = textOutput.match(/QUALITY_EXPOSURE:\s*([^\n]*)/i);
  const compositionMatch = textOutput.match(/QUALITY_COMPOSITION:\s*([^\n]*)/i);
  const printReadyMatch = textOutput.match(/QUALITY_PRINT_READY:\s*([^\n]*)/i);
  const confidenceMatch = textOutput.match(/CONFIDENCE:\s*(\d+)/i);

  if (!keywordMatch || !captionMatch) {
    // Fallback parsing for older format
    const fallbackKeywords = textOutput.match(/KEYWORDS:\s*([\s\S]*?)(?=\n\n|CAPTION:|CONFIDENCE:|$)/i);
    const fallbackCaption = textOutput.match(/CAPTION:\s*([\s\S]*?)(?=\n\n|CONFIDENCE:|$)/i);

    if (!fallbackKeywords || !fallbackCaption) {
      throw new Error('Metadata engine failed to parse output. Please retry.');
    }
  }

  const title = titleMatch ? titleMatch[1].trim() : 'Untitled Photo';
  const keywords = keywordMatch ? keywordMatch[1].trim().replace(/\n/g, '').replace(/\s+/g, '') : '';
  const caption = captionMatch ? captionMatch[1].trim().replace(/\.$/, '') : '';
  const confidenceScore = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 0;

  // Parse category
  let category: NewsCategory = 'national';
  if (categoryMatch) {
    const rawCategory = categoryMatch[1].trim().toLowerCase();
    const validCategories: NewsCategory[] = ['politics', 'sports', 'entertainment', 'business', 'national', 'international', 'lifestyle', 'crime', 'environment', 'technology'];
    if (validCategories.includes(rawCategory as NewsCategory)) {
      category = rawCategory as NewsCategory;
    }
  }

  // Parse extracted text
  const extractedText = extractedTextMatch
    ? extractedTextMatch[1].trim()
    : undefined;

  // Parse identified figures
  let identifiedFigures: string[] | undefined;
  if (identifiedFiguresMatch) {
    const figuresText = identifiedFiguresMatch[1].trim();
    if (!figuresText.toLowerCase().includes('no specific') && figuresText.length > 0) {
      identifiedFigures = figuresText.split(/[,\n]/).map(f => f.trim()).filter(f => f.length > 0);
    }
  }

  // Parse verification notes
  const verificationNotes = verificationMatch
    ? verificationMatch[1].trim()
    : undefined;

  // Parse quality assessment
  const quality = (sharpnessMatch || exposureMatch) ? {
    sharpness: (sharpnessMatch?.[1]?.trim()?.toLowerCase() || 'good') as 'excellent' | 'good' | 'acceptable' | 'poor',
    exposure: (exposureMatch?.[1]?.trim()?.toLowerCase() || 'correct') as 'correct' | 'overexposed' | 'underexposed',
    composition: compositionMatch?.[1]?.trim() || 'standard',
    printReady: printReadyMatch?.[1]?.trim()?.toLowerCase() === 'yes'
  } : undefined;

  // Generate suggested keywords based on category
  const suggestedKeywords = generateSuggestedKeywords(category, extractedText);

  return {
    title,
    keywords,
    caption,
    confidenceScore,
    category,
    extractedText: extractedText !== 'None visible' ? extractedText : undefined,
    identifiedFigures,
    verificationNotes,
    quality,
    suggestedKeywords
  };
}

/**
 * Generate category-specific suggested keywords
 */
function generateSuggestedKeywords(category: NewsCategory, extractedText?: string): string[] {
  const categoryKeywords: Record<NewsCategory, string[]> = {
    politics: ['government', 'minister', 'parliament', 'policy', 'election', 'democracy', 'legislation', 'official', 'diplomacy', 'cabinet'],
    sports: ['match', 'player', 'stadium', 'tournament', 'victory', 'team', 'championship', 'athlete', 'competition', 'sports'],
    entertainment: ['celebrity', 'performance', 'concert', 'film', 'music', 'artist', 'show', 'culture', 'award', 'entertainment'],
    business: ['economy', 'market', 'corporate', 'investment', 'trade', 'industry', 'finance', 'business', 'export', 'commerce'],
    national: ['bangladesh', 'dhaka', 'local', 'community', 'development', 'public', 'society', 'national', 'domestic', 'civic'],
    international: ['global', 'foreign', 'diplomatic', 'international', 'bilateral', 'summit', 'treaty', 'ambassador', 'world', 'cooperation'],
    lifestyle: ['culture', 'festival', 'tradition', 'celebration', 'fashion', 'food', 'travel', 'lifestyle', 'heritage', 'community'],
    crime: ['court', 'police', 'justice', 'legal', 'investigation', 'trial', 'verdict', 'law', 'crime', 'security'],
    environment: ['climate', 'nature', 'pollution', 'conservation', 'environment', 'green', 'ecology', 'disaster', 'sustainability', 'wildlife'],
    technology: ['digital', 'innovation', 'startup', 'technology', 'software', 'internet', 'ai', 'science', 'research', 'computing']
  };

  return categoryKeywords[category] || categoryKeywords.national;
}

/**
 * Verification pass for high-accuracy mode
 * Runs a second AI pass to verify person identifications
 */
export async function verifyMetadata(
  base64Image: string,
  mimeType: string,
  initialResult: ProcessingResult
): Promise<{ verified: boolean; corrections: string[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const verificationPrompt = `You are a fact-checker for The Daily Star newsroom.

Review this metadata that was generated for the attached image:

TITLE: ${initialResult.title}
CAPTION: ${initialResult.caption}
IDENTIFIED FIGURES: ${initialResult.identifiedFigures?.join(', ') || 'None'}

YOUR TASK:
1. Look at the image carefully.
2. Verify if the identified figures ACTUALLY appear in the image.
3. Check if any claims in the caption are visually verifiable.
4. Flag any potential errors or hallucinations.

RESPOND IN THIS FORMAT:
VERIFIED: [yes/no]
CORRECTIONS: [List specific issues, or "None needed"]
CONFIDENCE_ADJUSTMENT: [+/- adjustment to confidence score, e.g., -10, +5, 0]`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: verificationPrompt }
      ]
    },
    config: {
      temperature: 0.1,
      thinkingConfig: { thinkingBudget: 1024 }
    },
  });

  const textOutput = response.text || '';

  const verifiedMatch = textOutput.match(/VERIFIED:\s*(yes|no)/i);
  const correctionsMatch = textOutput.match(/CORRECTIONS:\s*([\s\S]*?)(?=\n\n|CONFIDENCE_ADJUSTMENT:|$)/i);

  const verified = verifiedMatch?.[1]?.toLowerCase() === 'yes';
  const correctionsText = correctionsMatch?.[1]?.trim() || '';
  const corrections = correctionsText.toLowerCase().includes('none')
    ? []
    : correctionsText.split(/[,\n]/).map(c => c.trim()).filter(c => c.length > 0);

  return { verified, corrections };
}
