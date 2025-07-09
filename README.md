# PDF Extract POC

A proof of concept application that extracts qualifications and school subjects from PDF documents using AI-powered text analysis.

## Features

- **PDF Text Extraction**: Supports both text-based PDFs (using pdf-parse) and image-based PDFs (using OCR with Tesseract)
- **AI-Powered Analysis**: Uses AI to extract qualifications and academic subjects from extracted text
- **Multi-Provider Support**: Supports both AWS Bedrock and Ollama for AI processing
- **Configurable Prompts**: Prompts are stored in JSON format for easy editing without code changes
- **Automatic Fallback**: Falls back to OCR extraction when standard PDF parsing yields minimal text

## Project Structure

```
src/
├── ai-integration/     # AI provider implementations (Bedrock, Ollama)
├── pdf-extract/        # PDF text extraction with OCR fallback
├── prompts.json        # Configurable AI prompts
└── index.ts           # Main application entry point
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```
PRODUCTION=false
AWS_REGION=us-east-1
BEDROCK_MODEL=anthropic.claude-3-sonnet-20240229-v1:0
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

3. For OCR functionality, ensure you have the required dependencies installed

## Usage

Run the application:
```bash
npm start
```

The application will:
1. Extract text from the PDF at `./src/pdfs/test.pdf`
2. Use AI to analyze the text and extract qualifications and subjects
3. Return the results in JSON format

## Configuration

### AI Providers

- **Production**: Uses AWS Bedrock (requires AWS credentials)
- **Development**: Uses Ollama (requires local Ollama installation)

### Customizing Prompts

Edit `src/prompts.json` to modify the AI extraction prompts:

```json
{
  "extractQualifications": "Your custom prompt here with {pdfText} placeholder"
}
```

## API

### `extractQualifications(pdfText: string, config: AIConfig)`

Returns:
```typescript
{
  qualifications: string[],  // Degrees, certifications, licenses
  subjects: string[]         // Academic subjects, courses, areas of study
}
```

## Development

Run tests:
```bash
npm test
```

Build:
```bash
npm run build
```

## Dependencies

- **PDF Processing**: pdf-parse, pdf2pic, tesseract.js
- **AI Integration**: @aws-sdk/client-bedrock-runtime, axios
- **Development**: TypeScript, Jest, Nx