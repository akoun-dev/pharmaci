import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { getSessionFromCookie } from '@/lib/auth';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

// Allowed file types with their magic numbers (first few bytes)
const ALLOWED_TYPES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
} as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_WIDTH = 1200;
const MAX_IMAGE_HEIGHT = 1200;

/**
 * Verify file magic numbers to prevent file type spoofing
 */
async function verifyFileType(buffer: Buffer, mimeType: string): Promise<boolean> {
  const magicNumbers = ALLOWED_TYPES[mimeType as keyof typeof ALLOWED_TYPES];
  if (!magicNumbers) return false;

  for (let i = 0; i < magicNumbers.length; i++) {
    if (buffer[i] !== magicNumbers[i]) return false;
  }
  return true;
}

/**
 * Generate a secure random filename
 */
function generateSecureFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const random = randomBytes(16).toString('hex');
  return `${Date.now()}-${random}${ext}`;
}

/**
 * Sanitize filename to prevent directory traversal
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.') // Prevent directory traversal
    .replace(/^[._]/, ''); // Remove leading dots/underscores
}

// POST /api/pharmacist/upload
export async function POST(request: Request) {
  try {
    // Auth check via session cookie
    const session = await getSessionFromCookie(
      new Request(request.clone(), {
        headers: request.headers,
      })
    );
    if (!session) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true, linkedPharmacyId: true },
    });

    if (!user || user.role !== 'pharmacist') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Aucun fichier reçu' },
        { status: 400 }
      );
    }

    // Validate file size first (before reading buffer)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Fichier trop volumineux. Maximum : ${MAX_FILE_SIZE / 1024 / 1024} Mo` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'Fichier vide' },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES]) {
      return NextResponse.json(
        { error: 'Type de fichier non supporté. Utilisez JPEG, PNG ou WebP.' },
        { status: 400 }
      );
    }

    // Read file buffer for magic number verification
    const buffer = Buffer.from(await file.arrayBuffer());

    // Verify actual file content matches declared type
    if (!(await verifyFileType(buffer, file.type))) {
      logger.warn('File type spoofing attempt detected', {
        userId: session.userId,
        declaredType: file.type,
      });
      return NextResponse.json(
        { error: 'Type de fichier invalide' },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true, mode: 0o755 });
    }

    // Process and validate image with sharp
    let processedBuffer: Buffer;
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Validate image dimensions
      if (metadata.width && metadata.width > MAX_IMAGE_WIDTH) {
        throw new Error(`Image trop large. Maximum : ${MAX_IMAGE_WIDTH}px`);
      }
      if (metadata.height && metadata.height > MAX_IMAGE_HEIGHT) {
        throw new Error(`Image trop haute. Maximum : ${MAX_IMAGE_HEIGHT}px`);
      }

      // Process image: resize if needed, convert to WebP, strip metadata
      processedBuffer = await image
        .resize(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85, effort: 6 })
        .toBuffer();
    } catch (error) {
      logger.error('Image processing error:', error);
      return NextResponse.json(
        { error: 'Erreur lors du traitement de l\'image' },
        { status: 400 }
      );
    }

    // Generate secure filename
    const safeFilename = sanitizeFilename(generateSecureFilename(file.name));
    const filename = `pharmacy-${safeFilename}`;
    const filePath = path.join(uploadsDir, filename);

    // Write file with restricted permissions
    await writeFile(filePath, processedBuffer, { mode: 0o644 });

    const imageUrl = `/uploads/${filename}`;

    logger.info('File uploaded successfully', {
      userId: session.userId,
      filename,
      size: processedBuffer.length,
    });

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    logger.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du téléchargement' },
      { status: 500 }
    );
  }
}
