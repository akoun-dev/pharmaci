import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

const MAINTENANCE_FILE = path.join(process.cwd(), 'data', 'maintenance.json');

async function readMaintenance(): Promise<{ enabled: boolean; message: string }> {
  try {
    const raw = await fs.readFile(MAINTENANCE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { enabled: false, message: '' };
  }
}

async function writeMaintenance(data: { enabled: boolean; message: string }): Promise<void> {
  await fs.writeFile(MAINTENANCE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { db } = await import('@/lib/db');
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const status = await readMaintenance();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { db } = await import('@/lib/db');
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const body = await request.json();

    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json({ error: 'Le champ "enabled" est requis (booléen)' }, { status: 400 });
    }

    const message = typeof body.message === 'string' ? body.message : '';
    const data = { enabled: body.enabled, message };

    await writeMaintenance(data);

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('Error updating maintenance status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
