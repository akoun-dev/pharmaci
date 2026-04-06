import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { deleteSessionCookie, deleteCSRFCookie } from '@/lib/auth';

// POST /api/auth/logout — Clear session
export async function POST() {
  const response = NextResponse.json({ message: 'Déconnexion réussie' });
  response.headers.append('Set-Cookie', deleteSessionCookie());
  response.headers.append('Set-Cookie', deleteCSRFCookie());
  return response;
}
