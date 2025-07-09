import { GenerateTextOptions } from '../ai-integration/index';

export interface BedrockConfig {
  region: string;
  model: string;
  anthropic_version: string;
  max_tokens: number;
  temperature: number;
  top_p: number;
}

let client: any;

function getConfig(config?: Partial<BedrockConfig>): BedrockConfig {
  if (!process.env.AWS_REGION || !process.env.BEDROCK_MODEL || !process.env.BEDROCK_ANTHROPIC_VERSION || !process.env.BEDROCK_MAX_TOKENS || !process.env.BEDROCK_TEMPERATURE || !process.env.BEDROCK_TOP_P) {
    throw new Error('Missing required Bedrock environment variables');
  }
  return {
    region: config?.region || process.env.AWS_REGION,
    model: config?.model || process.env.BEDROCK_MODEL,
    anthropic_version: config?.anthropic_version || process.env.BEDROCK_ANTHROPIC_VERSION,
    max_tokens: config?.max_tokens || parseInt(process.env.BEDROCK_MAX_TOKENS),
    temperature: config?.temperature || parseFloat(process.env.BEDROCK_TEMPERATURE),
    top_p: config?.top_p || parseFloat(process.env.BEDROCK_TOP_P)
  };
}

async function initializeClient(region: string) {
  if (!client) {
    const { BedrockRuntimeClient } = await import('@aws-sdk/client-bedrock-runtime');
    client = new BedrockRuntimeClient({
      region
    });
  }
  return client;
}

export async function generateText(prompt: string, options?: GenerateTextOptions, config?: Partial<BedrockConfig>): Promise<string> {
  const { InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
  
  const bedrockConfig = getConfig(config);
  const bedrockClient = await initializeClient(bedrockConfig.region);

  const modelId = options?.model || bedrockConfig.model;
  const body = JSON.stringify({
    anthropic_version: bedrockConfig.anthropic_version,
    max_tokens: options?.maxTokens || bedrockConfig.max_tokens,
    temperature: options?.temperature || bedrockConfig.temperature,
    top_p: options?.topP || bedrockConfig.top_p,
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
}

export async function* generateTextStream(prompt: string, config?: Partial<BedrockConfig>): AsyncGenerator<string, void, unknown> {
  const { InvokeModelWithResponseStreamCommand } = await import('@aws-sdk/client-bedrock-runtime');
  const bedrockConfig = getConfig(config);
  const bedrockClient = await initializeClient(bedrockConfig.region);

  const modelId = bedrockConfig.model;
  const body = JSON.stringify({
    anthropic_version: bedrockConfig.anthropic_version,
    max_tokens: bedrockConfig.max_tokens,
    temperature: bedrockConfig.temperature,
    top_p: bedrockConfig.top_p,
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
}