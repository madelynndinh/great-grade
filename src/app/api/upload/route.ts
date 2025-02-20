import { NextResponse } from 'next/server';
import { uploadToS3, deleteFromS3 } from '@/lib/s3';

// Disable body parser since we're handling multipart form data
export const config = {
  api: {
    bodyParser: false
  }
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3
    const s3Path = await uploadToS3(buffer, file.name);

    return NextResponse.json({
      message: 'File uploaded successfully',
      fileName: file.name,
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'Done',
      path: s3Path
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json({ error: 'No file name provided' }, { status: 400 });
    }

    await deleteFromS3(fileName);

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    );
  }
}