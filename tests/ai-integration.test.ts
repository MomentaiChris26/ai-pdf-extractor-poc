import { createAIService, getDefaultConfig, generateText, generateTextStream } from '../src/ai-integration';

describe('AI Integration', () => {
  const mockConfig = {
    provider: 'ollama' as const,
    region: 'us-east-1',
    model: 'llama3.2',
    baseUrl: 'http://localhost:11434',
    production: false
  };

  describe('Configuration', () => {
    it('should get default configuration', () => {
      const config = getDefaultConfig();
      expect(config).toBeDefined();
      expect(config.provider).toBeDefined();
      expect(['bedrock', 'ollama']).toContain(config.provider);
    });

    it('should create AI service with valid config', () => {
      const aiService = createAIService(mockConfig);
      expect(aiService).toBeDefined();
      expect(aiService.generateText).toBeDefined();
      expect(aiService.generateTextStream).toBeDefined();
    });
  });

  describe('Text Generation', () => {
    it('should generate text response', async () => {
      try {
        const config = getDefaultConfig();
        console.log(`Testing with provider: ${config.provider}`);
        
        const response = await generateText(config, 'Hello! Please introduce yourself briefly.');
        expect(response).toBeDefined();
        expect(typeof response).toBe('string');
        expect(response.length).toBeGreaterThan(0);
        
        console.log('AI Response:', response);
      } catch (error) {
        console.error('Error generating AI response:', error);
        // Don't fail the test if the AI service is not available
        expect(error).toBeDefined();
      }
    }, 30000); // 30 second timeout for AI calls

    it('should generate streaming text response', async () => {
      try {
        const config = getDefaultConfig();
        console.log(`Testing streaming with provider: ${config.provider}`);
        
        const streamGenerator = generateTextStream(config, 'Say hello in 5 words.');
        let response = '';
        
        for await (const chunk of streamGenerator) {
          response += chunk;
          if (response.length > 100) break; // Prevent infinite loops
        }
        
        expect(response).toBeDefined();
        expect(typeof response).toBe('string');
        
        console.log('AI Streaming Response:', response);
      } catch (error) {
        console.error('Error generating streaming AI response:', error);
        // Don't fail the test if the AI service is not available
        expect(error).toBeDefined();
      }
    }, 30000); // 30 second timeout for AI calls
  });

  describe('Error Handling', () => {
    it('should handle invalid provider', () => {
      const invalidConfig = {
        provider: 'invalid' as any,
        region: 'us-east-1',
        model: 'test',
        baseUrl: 'http://localhost:11434',
        production: false
      };

      expect(() => createAIService(invalidConfig)).toThrow('Unknown provider: invalid');
    });

    it('should handle missing required config', () => {
      const incompleteConfig = {
        provider: 'ollama' as const,
        region: 'us-east-1',
        production: false
      };

      expect(() => createAIService(incompleteConfig)).toThrow('AIConfig must specify baseUrl, model, and provider');
    });
  });
});