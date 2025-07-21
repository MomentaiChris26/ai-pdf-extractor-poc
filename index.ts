import { processDocument } from './src';
import fs from 'fs';
import path from 'path';

const pdfDir = './src/pdfs';

async function run() {
  const pdfFiles = fs.readdirSync(pdfDir)
    .filter(file => file.endsWith('.pdf'))
    .map(file => path.join(pdfDir, file));

  for (const pdfFile of pdfFiles) {
    processDocument(pdfFile)
      .then(result => {
        console.log(JSON.stringify(result, null, 2));
      })
      .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
      });
  }


}

run()