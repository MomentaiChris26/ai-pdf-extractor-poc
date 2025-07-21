import { generateText } from '../../ai-integration';

export async function translateText(input: string): Promise<string> {
  try {
    const prompt = `Translate the following text to English. Maintain the original formatting and structure. Only return the translated text, no explanations:

${input}`;

    const translatedText = await generateText(prompt);
    return translatedText.trim();
  } catch (error) {
    console.error('Translation error:', error);
    return `Translation failed: ${error}`;
  }
}