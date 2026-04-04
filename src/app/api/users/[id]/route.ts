import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Read userId from auth headers (set by middleware)
    const headerUserId = request.headers.get('X-User-Id');
    const isOwnProfile = headerUserId === id;

    const user = await db.user.findUnique({
      where: { id },
      include: {
        favorites: {
          include: {
            pharmacy: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        searchHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: { reviews: true, orders: true, favorites: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // If requesting own profile, return full data
    if (isOwnProfile) {
      return NextResponse.json(user);
    }

    // Public profile — return limited fields
    const publicUser = {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      city: user.city,
      _count: user._count,
    };

    return NextResponse.json(publicUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
