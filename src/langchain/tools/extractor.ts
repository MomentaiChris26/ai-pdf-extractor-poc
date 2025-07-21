import { generateText } from '../../ai-integration';

export async function extractSubjectsAndGrades(input: string): Promise<string> {
  try {
    const prompt = `Extract all subjects/courses and their corresponding grades from this academic transcript. Return the data as a structured JSON array with the following format:

[
  {
    "subject": "Course Name",
    "grade": "Grade/Score",
    "credits": "Credit Hours (if available)",
    "semester": "Semester/Term (if available)"
  }
]

If GPA is mentioned, include it as a separate field. Only return the JSON, no explanations:

${input}`;

    const extractedData = await generateText(prompt);
    return extractedData.trim();
  } catch (error) {
    console.error('Extraction error:', error);
    return `Extraction failed: ${error}`;
  }
}

export async function createManualVerificationReport(input: string): Promise<string> {
  try {
    const prompt = `Analyze this document and create a manual verification report. Identify areas that require human review and provide a structured summary:

1. Document Quality Issues (if any)
2. Ambiguous or Unclear Information
3. Key Information to Verify
4. Recommendations for Manual Review

Format as a clear, structured report:

${input}`;

    const report = await generateText(prompt);
    return report.trim();
  } catch (error) {
    console.error('Manual verification formatting error:', error);
    return `Manual verification formatting failed: ${error}`;
  }
}