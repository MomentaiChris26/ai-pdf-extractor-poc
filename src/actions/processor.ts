import { ClassificationResult } from '../ai-integration/types';

export interface ProcessedResult extends ClassificationResult {
  processed_data?: {
    translated_text?: string;
    extracted_subjects?: any[];
    verification_report?: string;
  };
  processing_completed: boolean;
}

export class ActionProcessor {
  
  static parseActions(additionalAction: string): string[] {
    return additionalAction
      .split(',')
      .map(action => action.trim().toLowerCase())
      .filter(action => action.length > 0);
  }

  static requiresProcessing(actions: string[]): boolean {
    const processableActions = [
      'translate',
      'translate_to_english', 
      'extract_subjects_and_grades',
      'manual_verification'
    ];
    
    return actions.some(action => 
      processableActions.some(processable => action.includes(processable))
    );
  }

  static getToolsForActions(actions: string[]): string[] {
    const toolMap: Record<string, string> = {
      'translate': 'translator',
      'translate_to_english': 'translator',
      'extract_subjects_and_grades': 'extract_subjects_and_grades',
      'manual_verification': 'manual_verification'
    };

    const tools: string[] = [];
    
    for (const action of actions) {
      for (const [actionKey, toolName] of Object.entries(toolMap)) {
        if (action.includes(actionKey) && !tools.includes(toolName)) {
          tools.push(toolName);
        }
      }
    }
    
    return tools;
  }

  static createProcessingPrompt(classification: ClassificationResult, actions: string[], documentText: string): string {
    const actionsList = actions.join(', ');
    
    return `You are a document processing assistant. You have been given a ${classification.classification} document in ${classification.language} from ${classification.origin}.

You need to perform the following actions: ${actionsList}

Available tools:
- translator: Translate text to English
- extract_subjects_and_grades: Extract academic subjects and grades
- manual_verification: Create verification report

Document text:
${documentText}

Please use the appropriate tools to complete the requested actions and provide the results.`;
  }
}