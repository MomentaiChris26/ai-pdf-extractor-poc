import { GenerateTextOptions } from '../ai-integration/index';

export interface BedrockConfig {
  region: string;
  model: string;
}

let client: any;

function getConfig(config?: Partial<BedrockConfig>): BedrockConfig {
  return {
    region: config?.region || process.env.AWS_REGION || 'us-east-1',
    model: config?.model || process.env.BEDROCK_MODEL || 'anthropic.claude-3-sonnet-20240229-v1:0'
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
}

export async function* generateTextStream(prompt: string, options?: GenerateTextOptions, config?: Partial<BedrockConfig>): AsyncGenerator<string, void, unknown> {
  const { InvokeModelWithResponseStreamCommand } = await import('@aws-sdk/client-bedrock-runtime');
  const bedrockConfig = getConfig(config);
  const bedrockClient = await initializeClient(bedrockConfig.region);

  const modelId = options?.model || bedrockConfig.model;
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
}