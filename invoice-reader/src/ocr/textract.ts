import AWS from 'aws-sdk';
import { OCRResult } from '../types.js';
import { config } from '../env.js';
import * as fs from 'fs/promises';

let textract: AWS.Textract | null = null;

/**
 * Get Textract client
 */
function getClient(): AWS.Textract {
  if (!textract) {
    AWS.config.update({
      region: config.awsRegion,
      accessKeyId: config.awsAccessKeyId,
      secretAccessKey: config.awsSecretAccessKey,
    });
    
    textract = new AWS.Textract();
  }
  return textract;
}

/**
 * Perform OCR using AWS Textract
 */
export async function performTextractOCR(filePath: string): Promise<OCRResult> {
  const startTime = Date.now();
  
  const client = getClient();
  
  // Read document
  const documentBuffer = await fs.readFile(filePath);
  
  // Analyze document
  const params: AWS.Textract.AnalyzeExpenseRequest = {
    Document: {
      Bytes: documentBuffer,
    },
  };
  
  const result = await client.analyzeExpense(params).promise();
  
  // Extract text from all blocks
  let fullText = '';
  let totalConfidence = 0;
  let blockCount = 0;
  
  for (const document of result.ExpenseDocuments || []) {
    // Extract from line items
    for (const lineItemGroup of document.LineItemGroups || []) {
      for (const lineItem of lineItemGroup.LineItems || []) {
        for (const field of lineItem.LineItemExpenseFields || []) {
          if (field.ValueDetection?.Text) {
            fullText += field.ValueDetection.Text + ' ';
            if (field.ValueDetection.Confidence) {
              totalConfidence += field.ValueDetection.Confidence;
              blockCount++;
            }
          }
        }
      }
    }
    
    // Extract from summary fields
    for (const field of document.SummaryFields || []) {
      if (field.ValueDetection?.Text) {
        fullText += field.ValueDetection.Text + ' ';
        if (field.ValueDetection.Confidence) {
          totalConfidence += field.ValueDetection.Confidence;
          blockCount++;
        }
      }
    }
  }
  
  const confidence = blockCount > 0 ? totalConfidence / blockCount / 100 : 0.5;
  const timeMs = Date.now() - startTime;
  
  return {
    text: fullText.trim(),
    confidence,
    timeMs,
    provider: 'textract',
  };
}

