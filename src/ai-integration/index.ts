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

export function createProvider(config: AIConfig): AIProvider {
  if (!config.baseUrl || !config.model || !config.provider) {
    throw new Error('AIConfig must specify baseUrl, model, and provider');
  }


  switch (config.provider) {
    case 'bedrock':
      return createBedrockProvider(config);
    case 'ollama':
      return createOllamaProvider(config);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

export async function generateText(config: AIConfig, prompt: string, options?: GenerateTextOptions): Promise<string> {
  const provider = createProvider(config);
  return provider.generateText(prompt, options);
}

export async function* generateTextStream(config: AIConfig, prompt: string, options?: GenerateTextOptions): AsyncGenerator<string, void, unknown> {
  const provider = createProvider(config);
  yield* provider.generateTextStream(prompt, options);
}

export function createBedrockProvider(config: AIConfig): AIProvider {
  const bedrockConfig = {
    region: config.region,
    model: config.model
  };

  return {
    generateText: (prompt: string, options?: GenerateTextOptions) => BedrockAPI.generateText(prompt, options, bedrockConfig),
    generateTextStream: (prompt: string, options?: GenerateTextOptions) => BedrockAPI.generateTextStream(prompt, options, bedrockConfig)
  };
}

export function createOllamaProvider(config: AIConfig): AIProvider {
  const ollamaConfig = {
    baseUrl: config.baseUrl,
    model: config.model
  };

  return {
    generateText: (prompt: string, options?: GenerateTextOptions) => OllamaAPI.generateText(prompt, options, ollamaConfig),
    generateTextStream: (prompt: string, options?: GenerateTextOptions) => OllamaAPI.generateTextStream(prompt, options, ollamaConfig)
  };
}

export function createAIService(config: AIConfig): AIProvider {
  return createProvider(config);
}

function loadPrompts(): any {
  const promptsPath = path.join(__dirname, '../prompts.json');
  const promptsData = fs.readFileSync(promptsPath, 'utf8');
  return JSON.parse(promptsData);
}

export async function extractQualifications(pdfText: string, config: AIConfig): Promise<{qualifications: string[], subjects: string[]}> {
  const prompts = loadPrompts();
  const prompt = prompts.extractQualifications.replace('{pdfText}', pdfText);

  try {
    const response = await generateText(config, prompt);
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

export function getDefaultConfig(): AIConfig {

  const isProduction = process.env.PRODUCTION === 'true';

  return {
    provider: isProduction ? 'bedrock' : 'ollama',
    region: process.env.AWS_REGION || 'us-east-1',
    model: isProduction ? process.env.BEDROCK_MODEL : process.env.OLLAMA_MODEL,
    baseUrl: process.env.OLLAMA_BASE_URL,
    production: isProduction
  };
}