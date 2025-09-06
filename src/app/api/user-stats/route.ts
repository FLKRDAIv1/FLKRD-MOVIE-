import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userStats } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('user_id');

    if (id) {
      // Get by ID - must belong to authenticated user
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db.select()
        .from(userStats)
        .where(and(eq(userStats.id, parseInt(id)), eq(userStats.userId, user.id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ error: 'User stats not found' }, { status: 404 });
      }

      return NextResponse.json(record[0]);
    } else if (userId) {
      // Get by user_id - must be the authenticated user's own stats
      if (userId !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      const record = await db.select()
        .from(userStats)
        .where(eq(userStats.userId, userId))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ error: 'User stats not found' }, { status: 404 });
      }

      return NextResponse.json(record[0]);
    } else {
      // Get authenticated user's stats
      const record = await db.select()
        .from(userStats)
        .where(eq(userStats.userId, user.id))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ error: 'User stats not found' }, { status: 404 });
      }

      return NextResponse.json(record[0]);
    }
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const requestBody = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { totalMoviesWatched, totalWatchTime, favoriteGenre } = requestBody;

    // Validation
    if (totalMoviesWatched !== undefined) {
      if (!Number.isInteger(totalMoviesWatched) || totalMoviesWatched < 0) {
        return NextResponse.json({ 
          error: "Total movies watched must be a non-negative integer",
          code: "INVALID_TOTAL_MOVIES" 
        }, { status: 400 });
      }
    }

    if (totalWatchTime !== undefined) {
      if (!Number.isInteger(totalWatchTime) || totalWatchTime < 0) {
        return NextResponse.json({ 
          error: "Total watch time must be a non-negative integer",
          code: "INVALID_TOTAL_WATCH_TIME" 
        }, { status: 400 });
      }
    }

    // Check if record exists and belongs to authenticated user
    const existingRecord = await db.select()
      .from(userStats)
      .where(and(eq(userStats.id, parseInt(id)), eq(userStats.userId, user.id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'User stats not found' }, { status: 404 });
    }

    // Prepare update data
    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (totalMoviesWatched !== undefined) {
      updates.totalMoviesWatched = totalMoviesWatched;
    }

    if (totalWatchTime !== undefined) {
      updates.totalWatchTime = totalWatchTime;
    }

    if (favoriteGenre !== undefined) {
      updates.favoriteGenre = favoriteGenre;
    }

    const updated = await db.update(userStats)
      .set(updates)
      .where(and(eq(userStats.id, parseInt(id)), eq(userStats.userId, user.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Failed to update user stats' }, { status: 500 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}