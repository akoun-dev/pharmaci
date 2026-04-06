import { PrismaClient } from '@prisma/client';
import { join } from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Get absolute path to database file
// In production (standalone mode), we need to look in the project root
// In development, the relative path works fine
const getDatabaseUrl = () => {
  const relativePath = process.env.DATABASE_URL?.replace('file:', '') || './db/custom.db';

  // If it's already an absolute path, use it
  if (relativePath.startsWith('/')) {
    return process.env.DATABASE_URL || 'file:./db/custom.db';
  }

  // In production with standalone mode, resolve from project root
  if (process.env.NODE_ENV === 'production') {
    // Use process.cwd() to get the current working directory
    // When running from .next/standalone, this should be the standalone folder
    // The database should be at the root of the project
    // turbopackIgnore: true - this is safe as we only use process.cwd() for db path
    const absolutePath = join(/* turbopackIgnore: true */ process.cwd(), relativePath);
    return `file:${absolutePath}`;
  }

  // In development, use the relative path from DATABASE_URL
  return process.env.DATABASE_URL || 'file:./db/custom.db';
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db