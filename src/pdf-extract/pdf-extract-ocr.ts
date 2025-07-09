import pdf2pic from 'pdf2pic';
import { createWorker } from 'tesseract.js';
import fs from 'fs';

interface OCROptions {
  outputDir?: string;
  format?: 'png' | 'jpg';
  density?: number;
  quality?: number;
}

export async function extractTextWithOCR(
  pdfPath: string, 
  options: OCROptions = {}
): Promise<string> {
  const {
    outputDir = './temp-images',
    format = 'png',
    density = 200,
    quality = 100
  } = options;

  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Convert PDF to images
    const convert = pdf2pic.fromPath(pdfPath, {
      density,
      saveFilename: "page",
      savePath: outputDir,
      format,
      quality
    });

    // Get total number of pages
    const pages = await convert.bulk(-1);

    // Initialize Tesseract worker
    const worker = await createWorker('eng');

    let allText = '';

    // Process each page
    for (let i = 0; i < pages.length; i++) {
      const imagePath = pages[i].path;
      if (!imagePath) {
        continue;
      }
      

      // Run OCR on the image
      const { data: { text } } = await worker.recognize(imagePath);
      allText += `\n--- Page ${i + 1} ---\n${text}\n`;

      // Clean up image file
      fs.unlinkSync(imagePath);
    }

    // Terminate worker
    await worker.terminate();

    // Clean up temp directory if empty
    try {
      fs.rmdirSync(outputDir);
    } catch (error) {
      // Directory not empty or doesn't exist, ignore
    }

    return allText.trim();

  } catch (error) {
    throw error;
  }
}

export default extractTextWithOCR;