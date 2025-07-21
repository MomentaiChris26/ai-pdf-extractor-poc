import { classifyAndAction } from "./ai-integration";
import { ClassificationResult } from "./ai-integration/types";
import { extractTextWithOCRFallback } from "./pdf-extract";
require('dotenv').config();

const ExtractAndRead = async (filePath: string): Promise<ClassificationResult> => {
  try {
    const pdfData = await extractTextWithOCRFallback(filePath);
    return classifyAndAction(pdfData);
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}
export default ExtractAndRead;