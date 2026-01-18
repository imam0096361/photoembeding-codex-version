
export type NewsCategory = 'politics' | 'sports' | 'entertainment' | 'business' | 'national' | 'international' | 'lifestyle' | 'crime' | 'environment' | 'technology';

export type CaptionStyle = 'ap' | 'social' | 'wire' | 'magazine' | 'archive';

export type ImageQuality = 'excellent' | 'good' | 'acceptable' | 'poor';

export type Priority = 'breaking' | 'urgent' | 'standard' | 'feature';

export interface QualityAssessment {
  sharpness: ImageQuality;
  exposure: 'correct' | 'overexposed' | 'underexposed';
  composition: string;
  printReady: boolean;
}

export interface StockMetadata {
  filename: string;
  title: string;
  keywords: string;
  caption: string;
  photographer: string;
  // Archival / Advanced fields
  creatorTool?: string;
  createDate?: string;
  modifyDate?: string;
  rights?: string;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'embedding';
  isEmbedded?: boolean;
  error?: string;
  previewUrl: string;
  confidenceScore?: number;
  // NEW: Enhanced metadata fields
  category?: NewsCategory;
  extractedText?: string;
  identifiedFigures?: string[];
  verificationNotes?: string;
  quality?: QualityAssessment;
  priority?: Priority;
  embargoDate?: string;
  suggestedKeywords?: string[];
}

export interface ProcessingResult {
  title: string;
  keywords: string;
  caption: string;
  confidenceScore: number;
  // NEW: Enhanced result fields
  category: NewsCategory;
  extractedText?: string;
  identifiedFigures?: string[];
  verificationNotes?: string;
  quality?: QualityAssessment;
  suggestedKeywords?: string[];
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED'
}

// Event Templates for common newsroom scenarios
export interface EventTemplate {
  id: string;
  name: string;
  description: string;
  category: NewsCategory;
  contextPrompt: string;
  suggestedKeywords: string[];
  knownFigures?: string[];
}

// Known Figure for recognition database
export interface KnownFigure {
  name: string;
  titles: string[];
  aliases?: string[];
  party?: string;
  organization?: string;
  visualCues?: string[];
  category: 'politics' | 'sports' | 'entertainment' | 'business' | 'other';
}

// Caption Style Configuration
export interface CaptionStyleConfig {
  id: CaptionStyle;
  name: string;
  description: string;
  promptModifier: string;
}

export const CAPTION_STYLES: CaptionStyleConfig[] = [
  {
    id: 'ap',
    name: 'AP Style',
    description: 'Formal, objective, present tense (Standard)',
    promptModifier: 'Write in AP Style: formal, objective, present tense. 2-3 sentences.'
  },
  {
    id: 'social',
    name: 'Social Media',
    description: 'Shorter, engaging, hashtag-ready',
    promptModifier: 'Write for social media: concise, engaging, under 280 characters. Include 2-3 relevant hashtags.'
  },
  {
    id: 'wire',
    name: 'Wire Service',
    description: 'Ultra-compact, facts-only',
    promptModifier: 'Write wire service style: maximum 1 sentence, essential facts only, location and date format.'
  },
  {
    id: 'magazine',
    name: 'Magazine',
    description: 'More descriptive, contextual',
    promptModifier: 'Write magazine style: descriptive, contextual, can be 3-4 sentences with rich detail.'
  },
  {
    id: 'archive',
    name: 'Archive',
    description: 'Detailed, historical context',
    promptModifier: 'Write for historical archive: detailed, include full names, titles, historical significance, and precise context.'
  }
];
