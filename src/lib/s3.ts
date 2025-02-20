import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGIONS || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY || '',
    secretAccessKey: process.env.AWS_SECRET_KEY || ''
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME|| '';

// Helper function to normalize file paths
function normalizeS3Key(fileName: string): string {
  // Remove any leading slashes and 'uploads/' prefix if present
  const normalizedKey = fileName.replace(/^\/?(uploads\/)?/, '');
  // Ensure the uploads/ prefix is added
  return `uploads/${normalizedKey}`;
}

export async function uploadToS3(file: Buffer, fileName: string): Promise<string> {
  try {
    const key = normalizeS3Key(fileName);
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: 'application/pdf'
    });

    await s3Client.send(command);
    return key;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
}

export async function deleteFromS3(fileName: string): Promise<void> {
  try {
    const key = normalizeS3Key(fileName);
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
}

export async function getSignedDownloadUrl(fileName: string): Promise<string> {
  try {
    const key = normalizeS3Key(fileName);
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate download URL');
  }
}

export async function getFileFromS3(fileName: string): Promise<Buffer> {
  try {
    const key = normalizeS3Key(fileName);
    
    // Check if file exists first
    try {
      const headCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      });
      await s3Client.send(headCommand);
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        throw new Error(`File ${fileName} does not exist in S3`);
      }
      throw error;
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const response = await s3Client.send(command);
    const chunks: Uint8Array[] = [];
    
    // @ts-ignore - response.Body.transformToByteArray() exists but TypeScript doesn't know about it
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Error getting file from S3:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to get file from S3');
  }
}