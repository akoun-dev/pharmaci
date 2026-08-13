import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Avoid logging every query by default: Prisma query logs can dump PII
// (emails, phones, order notes) into log streams. Enable explicitly via
// DB_LOG_QUERY=1 when debugging.
type PrismaLogLevel = 'query' | 'info' | 'warn' | 'error'
const queryLog: PrismaLogLevel[] = process.env.DB_LOG_QUERY === '1' ? ['query'] : []

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [...queryLog, 'warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db