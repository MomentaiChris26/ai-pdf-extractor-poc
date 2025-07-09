import axios from 'axios';
import { GenerateTextOptions } from '../ai-integration/index';

export interface OllamaConfig {
  baseUrl: string;
  model: string;
}

export interface OllamaApiRequest {
  model: string;
  prompt: string;
  stream: boolean;
  options: {
    temperature: number;
    top_p: number;
    num_predict: number;
  };
}

function getConfig(config?: Partial<OllamaConfig>): OllamaConfig {
  return {
    baseUrl: config?.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: config?.model || process.env.OLLAMA_MODEL || 'deepseek-r1:latest'
  };
}

async function generateRequest(
  prompt: string,
  stream: boolean,
  options?: GenerateTextOptions,
  config?: Partial<OllamaConfig>
) {
  const ollamaConfig = getConfig(config);
  const response = await axios.post(`${ollamaConfig.baseUrl}/api/generate`, {
    model: options?.model || ollamaConfig.model,
    prompt,
    stream,
    options: {
      temperature: options?.temperature || (stream ? 1 : 0.7),
      top_p: options?.topP || 0.9,
      num_predict: options?.maxTokens || 1000
    }
  }, stream ? {
    responseType: 'stream'
  } : {});

  return response;
}

export async function generateText(prompt: string, options?: GenerateTextOptions, config?: Partial<OllamaConfig>): Promise<string> {
  const response = await generateRequest(prompt, false, options, config);
  return response.data.response;
}

export async function* generateTextStream(prompt: string, options?: GenerateTextOptions, config?: Partial<OllamaConfig>): AsyncGenerator<string, void, unknown> {
  const response = await generateRequest(prompt, true, options, config);
  
  for await (const chunk of response.data) {
    const lines = chunk.toString().split('\n').filter((line: string) => line.trim());
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.response) {
          yield data.response;
        }
      } catch (e) {
        continue;
      }
    }
  }
}