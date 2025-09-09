import { translateText, extractSubjectsAndGrades, createManualVerificationReport } from './tools';
import { ProcessedResult } from '../actions/processor';
import logger from '../utils/logger';

export async function processDocumentActions(
  documentText: string, 
  actions: string[], 
  classification: any
): Promise<ProcessedResult> {
  try {
    const processed: any = {};
    
    for (const action of actions) {
      if (action.includes('translate')) {
        logger.info('🔄 Translating document...');
        processed.translated_text = await translateText(documentText);
      }
      
      if (action.includes('extract_subjects')) {
        logger.info('📊 Extracting subjects and grades...');
        const extractedData = await extractSubjectsAndGrades(documentText);
        processed.extracted_subjects = parseJSONSection(extractedData);
      }
      
      if (action.includes('manual_verification')) {
        logger.info('📋 Creating verification report...');
        processed.verification_report = await createManualVerificationReport(documentText);
      }
    }
    
    return {
      ...classification,
      processed_data: processed,
      processing_completed: true
    };
    
  } catch (error) {
    console.error('Document processing error:', error);
    return {
      ...classification,
      processed_data: {
        error: `Processing failed: ${error}`
      },
      processing_completed: false
    };
  }
}

function parseJSONSection(text: string): any[] {
  try {
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('JSON parsing error:', error);
  }
  return [];
}