import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSignedDownloadUrl } from '@/lib/s3';

// Configure the route as dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json({ error: 'No file name provided' }, { status: 400 });
    }

    const url = await getSignedDownloadUrl(fileName);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error generating view URL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate view URL' },
      { status: 500 }
    );
  }
}