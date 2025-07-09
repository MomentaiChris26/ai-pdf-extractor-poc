import axios from 'axios';
import { GenerateTextOptions } from '../ai-integration/index';

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  temperature: number;
  temperatureStream: number;
  topP: number;
  maxTokens: number;
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
  if (!process.env.OLLAMA_BASE_URL || !process.env.OLLAMA_MODEL || !process.env.OLLAMA_TEMPERATURE || !process.env.OLLAMA_TEMPERATURE_STREAM || !process.env.OLLAMA_TOP_P || !process.env.OLLAMA_MAX_TOKENS) {
    throw new Error('Missing required Ollama environment variables');
  }
  return {
    baseUrl: config?.baseUrl || process.env.OLLAMA_BASE_URL,
    model: config?.model || process.env.OLLAMA_MODEL,
    temperature: config?.temperature || parseFloat(process.env.OLLAMA_TEMPERATURE),
    temperatureStream: config?.temperatureStream || parseFloat(process.env.OLLAMA_TEMPERATURE_STREAM),
    topP: config?.topP || parseFloat(process.env.OLLAMA_TOP_P),
    maxTokens: config?.maxTokens || parseInt(process.env.OLLAMA_MAX_TOKENS)
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
      temperature: options?.temperature || (stream ? ollamaConfig.temperatureStream : ollamaConfig.temperature),
      top_p: options?.topP || ollamaConfig.topP,
      num_predict: options?.maxTokens || ollamaConfig.maxTokens
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