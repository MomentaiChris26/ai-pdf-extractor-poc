export type ClassificationResult = {
  classification: 'transcript' | 'certificate' | 'diploma' | 'license' | 'report' | 'letter' | 'form' | 'other';
  additional_action: string;
  language: string;
  origin: string;
}

export type GenerateTextOptions = {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  model?: string;
}

export type AIProvider = {
  generateText(prompt: string, options?: GenerateTextOptions): Promise<string>;
  generateTextStream(prompt: string, options?: GenerateTextOptions): AsyncGenerator<string, void, unknown>;
}