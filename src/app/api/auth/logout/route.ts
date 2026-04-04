import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { deleteSessionCookie } from '@/lib/auth';

// POST /api/auth/logout — Clear session
export async function POST() {
  return NextResponse.json(
    { message: 'Déconnexion réussie' },
    {
      headers: { 'Set-Cookie': deleteSessionCookie() },
    }
  );
}
