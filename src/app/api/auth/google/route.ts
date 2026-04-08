import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

// GET /api/auth/google — Google OAuth placeholder
export async function GET() {
  return NextResponse.json({
    message: 'La connexion Google sera bientôt disponible.',
    comingSoon: true,
  });
}

export async function POST() {
  return NextResponse.json({
    message: 'La connexion Google sera bientôt disponible.',
    comingSoon: true,
  });
}
