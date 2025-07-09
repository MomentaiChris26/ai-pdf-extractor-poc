import extractAndRead from "./extract-and-read";
import fs from 'fs';
import path from 'path';

const pdfDir = './src/pdfs';

export async function main() {
  try {
    const pdfFiles = fs.readdirSync(pdfDir)
      .filter(file => file.endsWith('.pdf'))
      .map(file => path.join(pdfDir, file));

    for (const pdfFile of pdfFiles) {
      const { qualifications, subjects } = await extractAndRead(pdfFile);
      console.log(qualifications, subjects);
    }

  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}
export default main;