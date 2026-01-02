
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
}

export interface ProcessingResult {
  title: string;
  keywords: string;
  caption: string;
  confidenceScore: number;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED'
}
