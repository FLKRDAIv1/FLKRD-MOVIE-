import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'profiles');

function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalName).toLowerCase();
  return `${timestamp}-${randomString}${extension}`;
}

function validateFileType(buffer: Buffer, filename: string): boolean {
  // Check file extension
  const extension = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return false;
  }

  // Check magic numbers for common image formats
  const magicNumbers = {
    jpeg: [0xFF, 0xD8, 0xFF],
    png: [0x89, 0x50, 0x4E, 0x47],
    gif: [0x47, 0x49, 0x46],
    webp: [0x52, 0x49, 0x46, 0x46] // RIFF header for WebP
  };

  // Check JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return ['.jpg', '.jpeg'].includes(extension);
  }

  // Check PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return extension === '.png';
  }

  // Check GIF
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return extension === '.gif';
  }

  // Check WebP (RIFF container)
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    // Check for WEBP signature at bytes 8-11
    if (buffer.length > 11 && 
        buffer[8] === 0x57 && buffer[9] === 0x45 && 
        buffer[10] === 0x42 && buffer[11] === 0x50) {
      return extension === '.webp';
    }
  }

  return false;
}

async function ensureUploadDirectory(): Promise<void> {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    // Check if request has multipart/form-data content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json({ 
        error: 'Content-Type must be multipart/form-data',
        code: 'INVALID_CONTENT_TYPE' 
      }, { status: 400 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ 
        error: 'No image file provided',
        code: 'MISSING_FILE' 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        code: 'FILE_TOO_LARGE' 
      }, { status: 413 });
    }

    if (file.size === 0) {
      return NextResponse.json({ 
        error: 'File is empty',
        code: 'EMPTY_FILE' 
      }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPG, PNG, GIF, and WebP images are allowed',
        code: 'INVALID_FILE_TYPE' 
      }, { status: 400 });
    }

    // Read file buffer for magic number validation
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file content using magic numbers
    if (!validateFileType(buffer, file.name)) {
      return NextResponse.json({ 
        error: 'File content does not match the file extension or is corrupted',
        code: 'INVALID_FILE_CONTENT' 
      }, { status: 400 });
    }

    // Sanitize filename and generate unique name
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = generateUniqueFilename(sanitizedOriginalName);

    // Ensure upload directory exists
    await ensureUploadDirectory();

    // Save file to disk
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);
    
    try {
      await writeFile(filePath, buffer);
    } catch (fileError) {
      console.error('File write error:', fileError);
      return NextResponse.json({ 
        error: 'Failed to save uploaded file',
        code: 'FILE_WRITE_ERROR' 
      }, { status: 500 });
    }

    // Generate public URL
    const imageUrl = `/uploads/profiles/${uniqueFilename}`;

    // Update user's profile image in database
    try {
      const updatedUser = await db.update(user)
        .set({
          image: imageUrl,
          updatedAt: new Date()
        })
        .where(eq(user.id, user.id))
        .returning();

      if (updatedUser.length === 0) {
        return NextResponse.json({ 
          error: 'Failed to update user profile',
          code: 'DATABASE_UPDATE_ERROR' 
        }, { status: 500 });
      }

      return NextResponse.json({
        imageUrl,
        message: 'Image uploaded successfully'
      }, { status: 201 });

    } catch (dbError) {
      console.error('Database update error:', dbError);
      
      // Clean up uploaded file if database update fails
      try {
        const fs = await import('fs/promises');
        await fs.unlink(filePath);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
      }

      return NextResponse.json({ 
        error: 'Failed to update user profile in database',
        code: 'DATABASE_ERROR' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('POST error:', error);
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('PayloadTooLargeError')) {
        return NextResponse.json({ 
          error: 'Request payload too large',
          code: 'PAYLOAD_TOO_LARGE' 
        }, { status: 413 });
      }
      
      if (error.message.includes('Invalid form data')) {
        return NextResponse.json({ 
          error: 'Invalid form data format',
          code: 'INVALID_FORM_DATA' 
        }, { status: 400 });
      }
    }

    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}