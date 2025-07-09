import { extractQualifications as extractQualAndSubjects } from "./ai-integration";
import { extractTextWithOCRFallback } from "./pdf-extract";
require('dotenv').config();

interface Result {
  qualifications: string[];
  subjects: string[];
}

const ExtractAndRead = async (filePath: string): Promise<Result> => {
  try {
    const pdfData = await extractTextWithOCRFallback(filePath);
    const { qualifications = [], subjects = [] } = await extractQualAndSubjects(pdfData);
    return { qualifications, subjects };
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}
export default ExtractAndRead;