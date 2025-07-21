/**
 * PDF OCR Text Extraction Module
 * 
 * This module provides functionality for extracting text from PDF documents using OCR (Optical Character Recognition).
 * It converts PDF pages to images and then uses Tesseract.js to perform OCR on the images.
 * This is particularly useful for scanned PDFs that don't have embedded text.
 * 
 * @module pdf-extract-ocr
 */

import pdf2pic from 'pdf2pic';
import { createWorker } from 'tesseract.js';
import fs from 'fs';

/**
 * Configuration options for OCR text extraction
 * 
 * @interface OCROptions
 * @property {string} [outputDir] - Directory to temporarily store converted images
 * @property {'png' | 'jpg'} [format] - Image format to use for OCR processing
 * @property {number} [density] - Image DPI density (higher values produce clearer images but larger files)
 * @property {number} [quality] - Image quality (1-100)
 */
interface OCROptions {
  outputDir?: string;
  format?: 'png' | 'jpg';
  density?: number;
  quality?: number;
}

/**
 * Extract text from a PDF document using OCR
 * 
 * This function converts a PDF to images and then performs OCR on each image to extract text.
 * The process involves:
 * 1. Converting each page of the PDF to an image
 * 2. Performing OCR on each image using Tesseract.js
 * 3. Combining the text from all pages
 * 4. Cleaning up temporary files
 * 
 * @param {string} pdfPath - Path to the PDF file
 * @param {OCROptions} options - Optional configuration for the OCR process
 * @returns {Promise<string>} - Extracted text from the PDF
 * @throws Will throw an error if PDF conversion or OCR process fails
 */
export async function extractTextWithOCR(
  pdfPath: string, 
  options: OCROptions = {}
): Promise<string> {
  // Extract and set default options
  const {
    outputDir = './temp-images',
    format = 'png',
    density = 200,
    quality = 100
  } = options;

  try {
    // Ensure output directory exists for temporary image storage
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Initialize pdf2pic converter with specified configuration
    const convert = pdf2pic.fromPath(pdfPath, {
      density,         // Resolution quality for the output images
      saveFilename: "page", // Base filename for each page image
      savePath: outputDir,  // Where to save temporary images
      format,          // Image format (png/jpg)
      quality          // Image quality (1-100)
    });

    // Convert all PDF pages to images (passing -1 means all pages)
    const pages = await convert.bulk(-1);

    // Initialize Tesseract OCR worker with English language data
    const worker = await createWorker('eng');

    // Variable to store all extracted text
    let allText = '';

    // Process each page image for text extraction
    for (let i = 0; i < pages.length; i++) {
      const imagePath = pages[i].path;
      // Skip if image path is missing
      if (!imagePath) {
        continue;
      }
      
      // Perform OCR on the current page image using Tesseract
      const { data: { text } } = await worker.recognize(imagePath);
      
      // Add page number and extracted text to the result
      allText += `\n--- Page ${i + 1} ---\n${text}\n`;

      // Delete temporary image file to free up space
      fs.unlinkSync(imagePath);
    }

    // Release Tesseract worker resources
    await worker.terminate();

    // Try to remove the temporary directory if it's empty
    try {
      fs.rmdirSync(outputDir);
    } catch (error) {
      // Silently ignore errors:
      // - Directory may not be empty (some files might remain)
      // - Directory might already be deleted
    }

    // Return the extracted text with any leading/trailing whitespace removed
    return allText.trim();

  } catch (error) {
    // Re-throw any errors that occurred during processing
    throw error;
  }
}

/**
 * Default export of the extractTextWithOCR function
 */
export default extractTextWithOCR;