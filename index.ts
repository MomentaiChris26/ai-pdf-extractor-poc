import { processDocument } from './src';
import fs from 'fs';
import path from 'path';
import logger from './src/utils/logger';

const pdfDir = './src/pdfs';

async function run() {
  const pdfFiles = fs.readdirSync(pdfDir)
    .filter(file => file.endsWith('.pdf'))
    .map(file => path.join(pdfDir, file));

  for (const pdfFile of pdfFiles) {
    processDocument(pdfFile)
      .then(result => {
        // Save result to a JSON file
        const outputFile = path.join(pdfDir, `${path.basename(pdfFile, '.pdf')}-result.json`);
        fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
        logger.info(`✅ Processed ${pdfFile} successfully. Result saved to ${outputFile}`);
      })
      .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
      });
  }


}

run()