import axios from 'axios';
import fs from 'fs';
import path from 'path';
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
  let client: any;

  const initializeClient = async () => {
    if (!client) {
      const { BedrockRuntimeClient } = await import('@aws-sdk/client-bedrock-runtime');
      client = new BedrockRuntimeClient({
        region: config.region || 'us-east-1'
      });
    }
    return client;
  };

  const generateText = async (prompt: string, options?: GenerateTextOptions): Promise<string> => {
    const { InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
    const bedrockClient = await initializeClient();

    const modelId = options?.model || config.model || 'anthropic.claude-3-sonnet-20240229-v1:0';
    const body = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
      top_p: options?.topP || 0.9,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const command = new InvokeModelCommand({
      modelId,
      body,
      contentType: 'application/json'
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return responseBody.content[0].text;
  };

  const generateTextStream = async function* (prompt: string, options?: GenerateTextOptions): AsyncGenerator<string, void, unknown> {
    const { InvokeModelWithResponseStreamCommand } = await import('@aws-sdk/client-bedrock-runtime');
    const bedrockClient = await initializeClient();

    const modelId = options?.model || config.model || 'anthropic.claude-3-sonnet-20240229-v1:0';
    const body = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
      top_p: options?.topP || 0.9,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const command = new InvokeModelWithResponseStreamCommand({
      modelId,
      body,
      contentType: 'application/json'
    });

    const response = await bedrockClient.send(command);

    for await (const chunk of response.body!) {
      if (chunk.chunk?.bytes) {
        const chunkData = JSON.parse(new TextDecoder().decode(chunk.chunk.bytes));
        if (chunkData.type === 'content_block_delta') {
          yield chunkData.delta.text;
        }
      }
    }
  };

  return {
    generateText,
    generateTextStream
  };
}

export function createOllamaProvider(config: AIConfig): AIProvider {
  const generateText = async (prompt: string, options?: GenerateTextOptions): Promise<string> => {
    const baseUrl = config.baseUrl;
    const model = options?.model || config.model || 'llama3.2';

    const response = await axios.post(`${baseUrl}/api/generate`, {
      model,
      prompt,
      stream: false,
      options: {
        temperature: options?.temperature || 0.7,
        top_p: options?.topP || 0.9,
        num_predict: options?.maxTokens || 1000
      }
    });

    return response.data.response;
  };

  const generateTextStream = async function* (prompt: string, options?: GenerateTextOptions): AsyncGenerator<string, void, unknown> {
    const baseUrl = config.baseUrl;
    const model = options?.model || config.model || 'llama3.2';

    const response = await axios.post(`${baseUrl}/api/generate`, {
      model,
      prompt,
      stream: true,
      options: {
        temperature: options?.temperature || 0.7,
        top_p: options?.topP || 0.9,
        num_predict: options?.maxTokens || 1000
      }
    }, {
      responseType: 'stream'
    });

    for await (const chunk of response.data) {
      const lines = chunk.toString().split('\n').filter((line: string) => line.trim());
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.response) {
            yield data.response;
          }
        } catch (e) {
          // Skip invalid JSON lines
        }
      }
    }
  };

  return {
    generateText,
    generateTextStream
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