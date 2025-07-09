import { extractQualifications as extractQualAndSubjects, getDefaultConfig } from "./ai-integration";
import { extractTextWithOCRFallback } from "./pdf-extract";
require('dotenv').config();

export async function main() {
  try {
    const config = getDefaultConfig();
    if (!config) {
      throw new Error('Failed to load AI configuration');
    }

    const pdfFilePath = './src/pdfs/test.pdf'
    const pdfData = await extractTextWithOCRFallback(pdfFilePath);

    const { qualifications = [], subjects = [] } = await extractQualAndSubjects(pdfData, config);
    
    return { qualifications, subjects };
    
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}
export default main;