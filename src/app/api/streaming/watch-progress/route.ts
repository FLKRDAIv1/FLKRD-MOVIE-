import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { streamingWatchProgress } from '@/db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db.select()
        .from(streamingWatchProgress)
        .where(and(eq(streamingWatchProgress.id, parseInt(id)), eq(streamingWatchProgress.userId, user.id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ error: 'Watch progress not found' }, { status: 404 });
      }

      return NextResponse.json(record[0]);
    }

    // List with filtering, pagination, and sorting
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const movieType = searchParams.get('type');
    const completed = searchParams.get('completed');
    const sort = searchParams.get('sort') || 'lastWatchedAt';
    const order = searchParams.get('order') || 'desc';

    let query = db.select().from(streamingWatchProgress);
    let conditions = [eq(streamingWatchProgress.userId, user.id)];

    // Filter by movie type
    if (movieType && (movieType === 'kurdish' || movieType === 'tmdb')) {
      conditions.push(eq(streamingWatchProgress.movieType, movieType));
    }

    // Filter by completion status
    if (completed !== null && completed !== undefined) {
      const isCompleted = completed === 'true';
      conditions.push(eq(streamingWatchProgress.isCompleted, isCompleted));
    }

    query = query.where(and(...conditions));

    // Sorting
    if (sort === 'lastWatchedAt') {
      query = order === 'asc' 
        ? query.orderBy(asc(streamingWatchProgress.lastWatchedAt))
        : query.orderBy(desc(streamingWatchProgress.lastWatchedAt));
    } else if (sort === 'createdAt') {
      query = order === 'asc' 
        ? query.orderBy(asc(streamingWatchProgress.createdAt))
        : query.orderBy(desc(streamingWatchProgress.createdAt));
    } else if (sort === 'progressPercentage') {
      query = order === 'asc' 
        ? query.orderBy(asc(streamingWatchProgress.progressPercentage))
        : query.orderBy(desc(streamingWatchProgress.progressPercentage));
    }

    const results = await query.limit(limit).offset(offset);
    return NextResponse.json(results);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const requestBody = await request.json();
    const { movieId, movieType, progressSeconds, totalDurationSeconds } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!movieId || typeof movieId !== 'number' || movieId <= 0) {
      return NextResponse.json({ 
        error: "movie_id is required and must be a positive integer",
        code: "INVALID_MOVIE_ID" 
      }, { status: 400 });
    }

    if (!movieType || (movieType !== 'kurdish' && movieType !== 'tmdb')) {
      return NextResponse.json({ 
        error: "movie_type is required and must be 'kurdish' or 'tmdb'",
        code: "INVALID_MOVIE_TYPE" 
      }, { status: 400 });
    }

    if (progressSeconds === undefined || progressSeconds === null || progressSeconds < 0) {
      return NextResponse.json({ 
        error: "progress_seconds must be a non-negative integer",
        code: "INVALID_PROGRESS_SECONDS" 
      }, { status: 400 });
    }

    if (!totalDurationSeconds || totalDurationSeconds <= 0) {
      return NextResponse.json({ 
        error: "total_duration_seconds is required and must be a positive integer",
        code: "INVALID_TOTAL_DURATION" 
      }, { status: 400 });
    }

    if (progressSeconds > totalDurationSeconds) {
      return NextResponse.json({ 
        error: "progress_seconds cannot exceed total_duration_seconds",
        code: "PROGRESS_EXCEEDS_DURATION" 
      }, { status: 400 });
    }

    // Auto-calculate progress_percentage and is_completed
    const progressPercentage = (progressSeconds / totalDurationSeconds) * 100;
    const isCompleted = progressPercentage >= 95;
    const now = new Date().toISOString();

    // Check if record exists (upsert behavior)
    const existingRecord = await db.select()
      .from(streamingWatchProgress)
      .where(and(
        eq(streamingWatchProgress.userId, user.id),
        eq(streamingWatchProgress.movieId, movieId),
        eq(streamingWatchProgress.movieType, movieType)
      ))
      .limit(1);

    if (existingRecord.length > 0) {
      // Update existing record
      const updated = await db.update(streamingWatchProgress)
        .set({
          progressSeconds,
          totalDurationSeconds,
          progressPercentage,
          isCompleted,
          lastWatchedAt: now,
          updatedAt: now
        })
        .where(and(
          eq(streamingWatchProgress.userId, user.id),
          eq(streamingWatchProgress.movieId, movieId),
          eq(streamingWatchProgress.movieType, movieType)
        ))
        .returning();

      return NextResponse.json(updated[0], { status: 200 });
    } else {
      // Create new record
      const newRecord = await db.insert(streamingWatchProgress)
        .values({
          userId: user.id,
          movieId,
          movieType,
          progressSeconds,
          totalDurationSeconds,
          progressPercentage,
          isCompleted,
          lastWatchedAt: now,
          createdAt: now,
          updatedAt: now
        })
        .returning();

      return NextResponse.json(newRecord[0], { status: 201 });
    }

  } catch (error) {
    console.error('POST error:', error);
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
    const { progressSeconds, totalDurationSeconds } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Check if record exists and belongs to user
    const existingRecord = await db.select()
      .from(streamingWatchProgress)
      .where(and(eq(streamingWatchProgress.id, parseInt(id)), eq(streamingWatchProgress.userId, user.id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'Watch progress not found' }, { status: 404 });
    }

    // Prepare update data
    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    // Validate and update fields if provided
    if (progressSeconds !== undefined) {
      if (progressSeconds < 0) {
        return NextResponse.json({ 
          error: "progress_seconds must be a non-negative integer",
          code: "INVALID_PROGRESS_SECONDS" 
        }, { status: 400 });
      }
      updates.progressSeconds = progressSeconds;
    }

    if (totalDurationSeconds !== undefined) {
      if (totalDurationSeconds <= 0) {
        return NextResponse.json({ 
          error: "total_duration_seconds must be a positive integer",
          code: "INVALID_TOTAL_DURATION" 
        }, { status: 400 });
      }
      updates.totalDurationSeconds = totalDurationSeconds;
    }

    // Recalculate progress if either value changed
    const finalProgressSeconds = updates.progressSeconds !== undefined ? updates.progressSeconds : existingRecord[0].progressSeconds;
    const finalTotalDuration = updates.totalDurationSeconds !== undefined ? updates.totalDurationSeconds : existingRecord[0].totalDurationSeconds;

    if (finalProgressSeconds > finalTotalDuration) {
      return NextResponse.json({ 
        error: "progress_seconds cannot exceed total_duration_seconds",
        code: "PROGRESS_EXCEEDS_DURATION" 
      }, { status: 400 });
    }

    // Auto-calculate progress_percentage and is_completed
    updates.progressPercentage = (finalProgressSeconds / finalTotalDuration) * 100;
    updates.isCompleted = updates.progressPercentage >= 95;
    updates.lastWatchedAt = new Date().toISOString();

    const updated = await db.update(streamingWatchProgress)
      .set(updates)
      .where(and(eq(streamingWatchProgress.id, parseInt(id)), eq(streamingWatchProgress.userId, user.id)))
      .returning();

    return NextResponse.json(updated[0]);

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    // Check if record exists and belongs to user before deleting
    const existingRecord = await db.select()
      .from(streamingWatchProgress)
      .where(and(eq(streamingWatchProgress.id, parseInt(id)), eq(streamingWatchProgress.userId, user.id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'Watch progress not found' }, { status: 404 });
    }

    const deleted = await db.delete(streamingWatchProgress)
      .where(and(eq(streamingWatchProgress.id, parseInt(id)), eq(streamingWatchProgress.userId, user.id)))
      .returning();

    return NextResponse.json({ 
      message: 'Watch progress deleted successfully',
      deleted: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}