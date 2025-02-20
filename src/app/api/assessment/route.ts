import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';
import { getFileFromS3 } from '@/lib/s3';
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { Document } from "langchain/document";
import * as fs from 'fs/promises';
import * as path from 'path';

// Constants
const AZURE_ENDPOINT = "https://iai-gpt-finetune.openai.azure.com/openai/deployments/iai-gpt4o/chat/completions?api-version=2024-02-15-preview";
const AZURE_API_KEY = process.env.AZURE_OPENAI_KEY || "9ee9bf1e4c844c5490142e19a629d18e";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Types and Interfaces
interface RequestBody {
  prompt: string;
  pdfPaths: string[];
  isQA?: boolean;
}

interface ResumeAnalysis {
  file: string;
  name: string;
  score: number;
  comment: string;
  strengths: string[];
  improvements: string[];
  fitForRole: string;
}

interface AssessmentResult {
  file: string;
  name: string;
  score: number;
  comment: string;
  strengths?: string[];
  improvements?: string[];
  fitForRole?: string;
  error?: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AzureResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

async function ensureTempDir(): Promise<string> {
  const tempDir = path.join(process.cwd(), 'tmp');
  try {
    await fs.access(tempDir);
  } catch {
    await fs.mkdir(tempDir, { recursive: true });
  }
  return tempDir;
}

async function extractTextFromPdf(filePath: string): Promise<string> {
  const tempDir = await ensureTempDir();
  const tempFilePath = path.join(tempDir, `${Date.now()}.pdf`);

  try {
    // Get file from S3
    const fileName = filePath.split('/').pop();
    if (!fileName) {
      throw new Error('Invalid file path');
    }

    const pdfBuffer = await getFileFromS3(fileName);
    
    // Write to temporary file
    await fs.writeFile(tempFilePath, pdfBuffer);
    
    // Use LangChain's PDFLoader
    const loader = new PDFLoader(tempFilePath, {
      splitPages: false
    });
    
    const docs = await loader.load();
    
    // Combine all pages into a single text
    return docs.map(doc => doc.pageContent).join('\n');
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    // Clean up temporary file
    try {
      await fs.unlink(tempFilePath);
    } catch (error) {
      console.warn('Failed to delete temporary file:', error);
      // Don't throw error for cleanup failure
    }
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function analyzeResumeWithRetry(
  pdfText: string, 
  prompt: string,
  filePath: string,
  isQA: boolean = false, 
  retryCount = 0
): Promise<string | ResumeAnalysis> {
  try {
    const systemMessage = isQA 
      ? "You are an AI assistant helping HR recruiters analyze candidate resumes and answer questions about them. Provide clear, concise answers based on the resume content."
      : `You are an expert HR recruiter evaluating resumes. You MUST provide your evaluation in the following JSON format:
        {
          "file": "${filePath}",
          "name": "Candidate",
          "score": <number between 0-100>,
          "comment": <brief summary comment>,
          "strengths": [<array of key strengths>],
          "improvements": [<array of areas for improvement>],
          "fitForRole": <brief assessment of fit>
        }
        
        Ensure all fields are present and properly formatted. The response MUST be valid JSON.`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt }
    ];

    const response = await axios.post<AzureResponse>(
      AZURE_ENDPOINT,
      {
        messages,
        temperature: 0.7,
        response_format: isQA ? undefined : { type: "json_object" }
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": AZURE_API_KEY,
        },
        timeout: 30000, // 30 second timeout
      }
    );

    const content = response.data.choices[0].message.content;
    return isQA ? content : JSON.parse(content);
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`Retry attempt ${retryCount + 1} for analysis...`);
      await sleep(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
      return analyzeResumeWithRetry(pdfText, prompt, filePath, isQA, retryCount + 1);
    }
    
    console.error('Error analyzing content:', error);
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.error?.message || error.message);
    }
    throw new Error('Failed to analyze content');
  }
}

// Main Route Handler
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as RequestBody;
    const { prompt, pdfPaths, isQA = false } = body;

    if (!prompt || !pdfPaths || !Array.isArray(pdfPaths)) {
      return NextResponse.json(
        { error: 'Invalid request. Prompt and pdfPaths array are required.' },
        { status: 400 }
      );
    }

    // Extract all resume texts
    const resumeTexts = await Promise.all(
      pdfPaths.map(async (path) => {
        try {
          return await extractTextFromPdf(path);
        } catch (error) {
          console.error(`Error extracting text from ${path}:`, error);
          return '';
        }
      })
    );

    // For Q&A, combine all resumes and analyze together
    if (isQA) {
      const combinedText = resumeTexts.join('\n\n--- Next Resume ---\n\n');
      const qaPrompt = `
        Based on the following resumes:

        ${combinedText}

        Please answer this question: ${prompt}

        Provide a clear and concise answer based only on the information available in the resumes.
      `;

      const answer = await analyzeResumeWithRetry(combinedText, qaPrompt, '', true);
      return NextResponse.json({ answer });
    }

    // For regular assessment, analyze each resume separately
    const jobTitleMatch = prompt.match(/position of ([^.]+)/);
    const jobDescriptionMatch = prompt.match(/Job Description: ([^]+?)(?=\n\nEvaluate|$)/);
    
    const jobTitle = jobTitleMatch ? jobTitleMatch[1].trim() : 'Unknown Position';
    const jobDescription = jobDescriptionMatch ? jobDescriptionMatch[1].trim() : '';

    // Process each resume
    const results: AssessmentResult[] = await Promise.all(
      pdfPaths.map(async (path, index) => {
        try {
          console.log(`Processing resume: ${path}`);
          const pdfText = resumeTexts[index];
          if (!pdfText) {
            throw new Error('Failed to extract text from PDF');
          }

          const assessmentPrompt = `
            Evaluate this candidate for the position of ${jobTitle}.
            
            Job Description: ${jobDescription}
            
            Resume Content:
            ${pdfText}
            
            Provide a detailed evaluation including:
            1. Overall score (0-100) based on qualifications and experience
            2. Key strengths (list specific skills and experiences)
            3. Areas of improvement (list specific gaps or areas needing development)
            4. Fit for the role (assess overall suitability)
            5. Brief summary comment
          `;

          const analysis = await analyzeResumeWithRetry(pdfText, assessmentPrompt, path, false) as ResumeAnalysis;
          return analysis;
        } catch (error) {
          console.error(`Error processing ${path}:`, error);
          return {
            file: path,
            name: 'Candidate',
            score: 0,
            comment: `Failed to process resume: ${error instanceof Error ? error.message : 'Unknown error'}`,
            strengths: [],
            improvements: [],
            fitForRole: 'Not evaluated',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Assessment error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Assessment failed',
        details: error instanceof AxiosError ? error.response?.data : undefined
      },
      { status: 500 }
    );
  }
}