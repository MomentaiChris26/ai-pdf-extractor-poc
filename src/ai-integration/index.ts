import fs from 'fs';
import path from 'path';
import * as OllamaAPI from '../api/ollama-api';
import * as BedrockAPI from '../api/bedrock-api';
require('dotenv').config();

export interface AIProvider {
  generateText(prompt: string, options?: GenerateTextOptions): Promise<string>;
  generateTextStream(prompt: string, options?: GenerateTextOptions): AsyncGenerator<string, void, unknown>;
}

export interface GenerateTextOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  model?: string;
}

export interface AIConfig {
  provider: 'bedrock' | 'ollama';
  region?: string;
  model?: string;
  baseUrl?: string;
  production?: boolean;
}

export function createProvider(): AIProvider {
  const isProduction = process.env.PRODUCTION ? 'bedrock' : 'ollama';

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

export async function extractQualifications(pdfText: string): Promise<{ qualifications: string[], subjects: string[] }> {
  const prompts = loadPrompts();
  const prompt = prompts.extractQualifications.replace('{pdfText}', pdfText);

  try {
    const response = await generateText(prompt);
    // More aggressive cleaning
    let cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();

    // Find JSON object in the response
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    const result = JSON.parse(cleanedResponse);
    return result;
  } catch (error) {
    return { qualifications: [], subjects: [] };
  }
}
