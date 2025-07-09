import pdf from 'pdf-parse';
import fs from 'fs';
import { extractTextWithOCR } from './pdf-extract-ocr';

async function extractTextWithPdfParse(filePath: string): Promise<string> {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        
        return data.text;
    } catch (error) {
        throw error;
    }
}

export async function extractTextWithOCRFallback(filePath: string): Promise<string> {
    try {
        // Try pdf-parse first (faster for text-based PDFs)
        const textFromPdfParse = await extractTextWithPdfParse(filePath);
        
        // If we get meaningful text, use it
        if (textFromPdfParse && textFromPdfParse.trim().length > 50) {
            return textFromPdfParse;
        }
        
        // If pdf-parse fails or returns minimal text, try OCR
        return await extractTextWithOCR(filePath);
        
    } catch (error) {
        throw error;
    }
}

export { extractTextWithOCR };
export default extractTextWithPdfParse;