import { NextResponse } from 'next/server';
import { getSignedDownloadUrl } from '@/lib/s3';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json({ error: 'No file name provided' }, { status: 400 });
    }

    const url = await getSignedDownloadUrl(fileName);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}