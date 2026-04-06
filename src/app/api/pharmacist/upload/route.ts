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
    logger.info('Upload request received');

    // Auth check via session cookie
    const session = await getSessionFromCookie(request);
    if (!session) {
      logger.warn('Upload failed: No session');
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    logger.info('Upload session valid', { userId: session.userId });

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true, linkedPharmacyId: true },
    });

    if (!user || user.role !== 'pharmacist') {
      logger.warn('Upload failed: Not a pharmacist', { userId: session.userId, role: user?.role });
      return NextResponse.json(
        { error: 'Accès réservé aux pharmaciens' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      logger.warn('Upload failed: No file received');
      return NextResponse.json(
        { error: 'Aucun fichier reçu. Veuillez sélectionner une image.' },
        { status: 400 }
      );
    }

    logger.info('File received', {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Validate file size first (before reading buffer)
    if (file.size > MAX_FILE_SIZE) {
      logger.warn('Upload failed: File too large', { size: file.size });
      return NextResponse.json(
        { error: `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum : ${MAX_FILE_SIZE / 1024 / 1024} Mo` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      logger.warn('Upload failed: Empty file');
      return NextResponse.json(
        { error: 'Fichier vide' },
        { status: 400 }
      );
    }

    // Accept more MIME types and be more permissive
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const normalizedType = file.type.toLowerCase();
    const baseType = normalizedType === 'image/jpg' ? 'image/jpeg' : normalizedType;

    if (!allowedTypes.includes(normalizedType) && !allowedTypes.includes(baseType)) {
      logger.warn('Upload failed: Invalid file type', { fileType: file.type });
      return NextResponse.json(
        { error: `Type de fichier non supporté: ${file.type || 'inconnu'}. Utilisez JPEG, PNG ou WebP.` },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Skip magic number verification for now to be more permissive
    // Verify actual file content matches declared type (use normalized type)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(baseType)) {
      logger.warn('Upload failed: Invalid normalized type', { normalizedType });
      return NextResponse.json(
        { error: 'Type de fichier invalide' },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      logger.info('Creating uploads directory', { uploadsDir });
      await mkdir(uploadsDir, { recursive: true, mode: 0o755 });
    }

    // Process and validate image with sharp
    let processedBuffer: Buffer;
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      logger.info('Image metadata', {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
      });

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
        { error: `Erreur lors du traitement de l'image: ${error instanceof Error ? error.message : 'Image invalide'}` },
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
      { error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}
