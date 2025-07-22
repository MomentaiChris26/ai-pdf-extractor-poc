import { extractTextWithOCRFallback } from './pdf-extract';
import { classifyAndAction } from './ai-integration';
import { ActionProcessor, ProcessedResult } from './actions/processor';
import { processDocumentActions } from './langchain/agent';
import { processDocumentActionsWithGraph } from './langchain/graph-agent';

export interface FullProcessingResult {
  classification: any;
  processed_result: ProcessedResult;
  processing_time: number;
}

export async function processDocument(filePath: string): Promise<FullProcessingResult> {
  const startTime = Date.now();
  
  try {
    // Step 1: Extract text from PDF
    console.log('🔍 Extracting text from PDF...');
    const rawText = await extractTextWithOCRFallback(filePath);
    
    // Step 2: Classify document and get additional actions
    console.log('📋 Classifying document...');
    const classification = await classifyAndAction(rawText);
    
    // Step 3: Process additional actions if needed
    console.log('⚙️ Processing additional actions...');
    const actions = ActionProcessor.parseActions(classification.additional_action);
    
    let processedResult: ProcessedResult;
    
    if (ActionProcessor.requiresProcessing(actions)) {
      console.log(`🤖 Processing actions with LangGraph: ${actions.join(', ')}`);
      processedResult = await processDocumentActionsWithGraph(rawText, actions, classification);
    } else {
      console.log('✅ No additional processing required');
      processedResult = {
        ...classification,
        processing_completed: true
      };
    }
    
    const processingTime = Date.now() - startTime;
    
    console.log(`✨ Processing completed in ${processingTime}ms`);
    
    return {
      classification,
      processed_result: processedResult,
      processing_time: processingTime
    };
    
  } catch (error) {
    console.error('❌ Pipeline error:', error);
    throw error;
  }
}

// Main function for CLI usage
export async function processPDF(filePath: string): Promise<FullProcessingResult> {
  return await processDocument(filePath);
}

// Export for library usage
export { ActionProcessor, processDocumentActions, processDocumentActionsWithGraph };
export type { ClassificationResult } from './ai-integration/types';
export type { ProcessedResult } from './actions/processor';

