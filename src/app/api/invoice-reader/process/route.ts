import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { queueInvoiceProcessing, getJobStatus, waitForJob } from '@/lib/invoice-reader-integration';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Queue invoice for processing
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mode = formData.get('mode') as string || 'queue'; // 'queue' or 'immediate'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Save file temporarily
    const uploadDir = path.join(process.cwd(), 'uploads', 'invoices');
    await fs.mkdir(uploadDir, { recursive: true });

    const fileName = `${Date.now()}_${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    if (mode === 'immediate') {
      // Process immediately and wait for result
      try {
        const { processInvoiceNow } = await import('@/lib/invoice-reader-integration');
        const result = await processInvoiceNow(filePath);

        return NextResponse.json({
          success: true,
          mode: 'immediate',
          data: result,
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Processing failed',
        }, { status: 500 });
      }
    } else {
      // Queue for background processing
      const jobId = await queueInvoiceProcessing(filePath);

      return NextResponse.json({
        success: true,
        mode: 'queue',
        jobId,
        message: 'Invoice queued for processing',
      });
    }
  } catch (error) {
    console.error('Error in invoice processing:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * Get job status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const wait = searchParams.get('wait') === 'true';

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    if (wait) {
      // Wait for job completion (with timeout)
      try {
        const result = await waitForJob(jobId, 60000);
        return NextResponse.json({
          success: true,
          status: 'completed',
          data: result,
        });
      } catch (error) {
        const job = getJobStatus(jobId);
        return NextResponse.json({
          success: false,
          status: job?.status || 'not_found',
          error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
      }
    } else {
      // Just return current status
      const job = getJobStatus(jobId);

      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        job: {
          id: job.id,
          status: job.status,
          result: job.result,
          error: job.error,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
        },
      });
    }
  } catch (error) {
    console.error('Error getting job status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

