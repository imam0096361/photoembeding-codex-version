export type NewsCategory = 'politics' | 'sports' | 'entertainment' | 'business' | 'national' | 'international' | 'lifestyle' | 'crime' | 'environment' | 'technology';

export type CaptionStyle = 'ap' | 'social' | 'wire' | 'magazine' | 'archive' | 'teach';

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
  wireCaption: string;
  archivalDescription: string;
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
  publicationStatus?: string;
}

export interface ProcessingResult {
  title: string;
  keywords: string;
  wireCaption: string;
  archivalDescription: string;
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
