import { translateText, extractSubjectsAndGrades, createManualVerificationReport } from './tools';
import { ProcessedResult } from '../actions/processor';
import { StateGraph, END, START, Annotation } from '@langchain/langgraph';

const DocumentStateAnnotation = Annotation.Root({
  documentText: Annotation<string>,
  actions: Annotation<string[]>,
  classification: Annotation<any>,
  processed: Annotation<any>,
  currentAction: Annotation<number>,
  error: Annotation<string>
});

type DocumentState = typeof DocumentStateAnnotation.State;

const processAction = async (state: DocumentState): Promise<Partial<DocumentState>> => {
  const action = state.actions[state.currentAction];
  const updates: any = { processed: { ...state.processed } };
  
  if (action?.includes('translate')) {
    console.log('🔄 Translating document...');
    const translated_text = await translateText(state.documentText);
    updates.processed.translated_text = translated_text;
  }
  
  if (action?.includes('extract_subjects')) {
    console.log('📊 Extracting subjects and grades...');
    const extractedData = await extractSubjectsAndGrades(state.documentText);
    updates.processed.extracted_subjects = parseJSONSection(extractedData);
  }
  
  if (action?.includes('manual_verification')) {
    console.log('📋 Creating verification report...');
    const verification_report = await createManualVerificationReport(state.documentText);
    updates.processed.verification_report = verification_report;
  }
  
  return updates;
};

const incrementAction = (state: DocumentState): Partial<DocumentState> => {
  return { currentAction: state.currentAction + 1 };
};

const shouldContinue = (state: DocumentState): string => {
  return state.currentAction < state.actions.length - 1 ? "continue" : END;
};

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

export async function processDocumentActionsWithGraph(
  documentText: string, 
  actions: string[], 
  classification: any
): Promise<ProcessedResult> {
  try {
    const workflow = new StateGraph(DocumentStateAnnotation)
      .addNode("processAction", processAction)
      .addNode("increment", incrementAction)
      .addEdge(START, "processAction")
      .addEdge("processAction", "increment")
      .addConditionalEdges("increment", shouldContinue, {
        continue: "processAction",
        [END]: END
      });

    const app = workflow.compile();

    const initialState = {
      documentText,
      actions,
      classification,
      processed: {},
      currentAction: 0
    };

    const result = await app.invoke(initialState);
    
    return {
      ...classification,
      processed_data: result.processed,
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