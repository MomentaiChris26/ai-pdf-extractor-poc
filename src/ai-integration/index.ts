import fs from 'fs';
import path from 'path';
import * as OllamaAPI from '../api/ollama-api';
import * as BedrockAPI from '../api/bedrock-api';
import { AIProvider, ClassificationResult, GenerateTextOptions } from './types';
import { VALID_DOCUMENT_TYPES } from './constants';
require('dotenv').config();

export interface AIConfig {
  provider: 'bedrock' | 'ollama';
  region?: string;
  model?: string;
  baseUrl?: string;
  production?: boolean;
}

export function createProvider(): AIProvider {
  const isProduction = process.env.PRODUCTION ? 'bedrock' : 'ollama';

  return createOllamaProvider();
  switch (isProduction) {
    case 'bedrock':
      return createBedrockProvider();
    case 'ollama':
      return createOllamaProvider();
    default:
      throw new Error(`Unknown provider: ${isProduction}`);
  }
}

export async function generateText(prompt: string, options?: GenerateTextOptions): Promise<string> {
  const provider = createProvider();
  return provider.generateText(prompt, options);
}

export async function* generateTextStream(prompt: string, options?: GenerateTextOptions): AsyncGenerator<string, void, unknown> {
  const provider = createProvider();
  yield* provider.generateTextStream(prompt, options);
}

export function createBedrockProvider(): AIProvider {

  return {
    generateText: (prompt: string, options?: GenerateTextOptions) => BedrockAPI.generateText(prompt, options),
    generateTextStream: (prompt: string, options?: GenerateTextOptions) => BedrockAPI.generateTextStream(prompt, options)
  };
}

export function createOllamaProvider(): AIProvider {
  return {
    generateText: (prompt: string, options?: GenerateTextOptions) => OllamaAPI.generateText(prompt, options),
    generateTextStream: (prompt: string, options?: GenerateTextOptions) => OllamaAPI.generateTextStream(prompt, options)
  };
}

export function createAIService(): AIProvider {
  return createProvider();
}

function loadPrompts(): any {
  const promptsPath = path.join(__dirname, '../prompts.json');
  const promptsData = fs.readFileSync(promptsPath, 'utf8');
  return JSON.parse(promptsData);
}


// Legacy function - use classifyAndAction instead
export async function classifyPdfDocument(pdfText: string): Promise<ClassificationResult> {
  const result = await classifyAndAction(pdfText);
  return result;
}

export async function classifyAndAction(pdfText: string): Promise<ClassificationResult> {
  const prompts = loadPrompts();
  const prompt = prompts.classifyPdfDocument.replace('{pdfText}', pdfText);

  try {
    const response = await generateText(prompt);
    let cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();

    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    const result = JSON.parse(cleanedResponse);
    
    const classification = VALID_DOCUMENT_TYPES.includes(result.classification) ? result.classification : 'unknown';
    
    const language = result.language || 'unknown';
    let additionalAction = result.additional_action || 'Document requires manual review';

    if (classification === 'unknown' || result.origin === 'Unknown') {
      additionalAction += ', manual_verification';
    }

    return {
      classification,
      additional_action: additionalAction,
      language,
      origin: result.origin || 'Unknown'
    };
  } catch (error) {
    console.error('Error classifying PDF document:', error);
    return {
      classification: 'other',
      additional_action: 'Classification failed - document requires manual review',
      language: 'unknown',
      origin: 'Unknown'
    };
  }
}
